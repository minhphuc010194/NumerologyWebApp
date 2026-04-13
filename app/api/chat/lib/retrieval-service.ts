/**
 * RAG Retrieval Service — orchestrates hybrid search across Chunk, Summary, and QA collections.
 * Searches both Vietnamese and English content simultaneously.
 * Combines semantic (dense) and BM25 (sparse) search with weighted reranking.
 */
import { WeightedRanker } from '@zilliz/milvus2-sdk-node';
import {
  getMilvusClient,
  COLLECTION_CHUNK,
  COLLECTION_SUMMARY,
  COLLECTION_QA,
  SEARCH_FIELDS
} from './milvus-client';
import { generateEmbedding } from './embedding-service';
import { expandQueryForRetrieval } from './query-expansion';
import type { UserProviderConfig } from './response-generator';

// --- Types ---

export interface RetrievalSource {
  title: string;
  content: string;
  refLink?: string;
  collection: 'chunk' | 'summary' | 'qa';
  score: number;
  language?: string;
}

interface RetrievalResult {
  context: string;
  sources: RetrievalSource[];
  /** Language detected from the user's query during expansion */
  detectedLanguage: string;
}

// --- Configuration ---

const SEARCH_LIMITS = {
  chunk: 15,
  summary: 5,
  qa: 5
} as const;

const SEMANTIC_WEIGHT = 0.7;
const BM25_WEIGHT = 0.3;

const MAX_CONTEXT_CHARS = 128_000; // ~32000 tokens

// --- Main Retrieval ---

/**
 * Performs parallel hybrid search across all 3 collections.
 * Returns merged context string and source references.
 */
export async function retrieveContext(
  query: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userProviderConfig?: UserProviderConfig,
  options?: { skipExpansion?: boolean; language?: string }
): Promise<RetrievalResult> {
  let searchQuery = query;
  let detectedLanguage = options?.language || 'Vietnamese';

  // Step 1: Expand short queries with context-aware keywords + detect language
  if (!options?.skipExpansion) {
    const expansion = await expandQueryForRetrieval({
      originalQuery: query,
      systemPrompt,
      recentHistory: conversationHistory
    }, userProviderConfig);
    searchQuery = expansion.expandedQuery;
    detectedLanguage = expansion.detectedLanguage;
  } else {
    console.log('[Retrieval] skipExpansion=true — using raw query for search');
  }
  // Step 2: Generate embedding from expanded query
  console.time('[Perf] Embedding Generation');
  const queryEmbedding = await generateEmbedding(searchQuery);
  console.timeEnd('[Perf] Embedding Generation');

  // Step 3: Parallel hybrid search using expanded query
  const [chunkResults, summaryResults, qaResults] = await Promise.allSettled([
    searchCollection(
      COLLECTION_CHUNK,
      searchQuery,
      queryEmbedding,
      SEARCH_LIMITS.chunk
    ),
    searchCollection(
      COLLECTION_SUMMARY,
      searchQuery,
      queryEmbedding,
      SEARCH_LIMITS.summary
    ),
    searchCollection(
      COLLECTION_QA,
      searchQuery,
      queryEmbedding,
      SEARCH_LIMITS.qa
    )
  ]);

  const chunks = extractResults(chunkResults, 'chunk');
  const summaries = extractResults(summaryResults, 'summary');
  const qaItems = extractResults(qaResults, 'qa');

  const allSources = [...chunks, ...summaries, ...qaItems];

  // Deduplicate by title
  const deduplicatedSources = deduplicateByTitle(allSources);

  // Build context string with token budget
  const context = buildContextString(deduplicatedSources);

  return {
    context,
    sources: deduplicatedSources,
    detectedLanguage
  };
}

// --- Hybrid Search per Collection ---

async function searchCollection(
  collectionName: string,
  queryText: string,
  queryEmbedding: number[],
  limit: number
): Promise<RetrievalSource[]> {
  const client = getMilvusClient();
  const fields = SEARCH_FIELDS[collectionName as keyof typeof SEARCH_FIELDS];

  if (!fields) {
    throw new Error(`Unknown collection: ${collectionName}`);
  }

  try {
    console.time(`[Perf] Milvus Search (${collectionName})`);
    const response = await client.hybridSearch({
      collection_name: collectionName,
      data: [
        {
          data: [queryEmbedding], // Dense Vector search
          anns_field: fields.denseField,
          params: { nprobe: 16 }
        },
        {
          data: queryText as any, // BM25 Sparse Vector search (Milvus FTS string payload)
          anns_field: fields.sparseField
        }
      ],
      rerank: WeightedRanker([SEMANTIC_WEIGHT, BM25_WEIGHT]),
      limit,
      output_fields: fields.outputFields as unknown as string[]
    });
    console.timeEnd(`[Perf] Milvus Search (${collectionName})`);

    if (!response.results?.length) {
      return [];
    }

    return response.results.map((result) =>
      mapResultToSource(result, collectionName)
    );
  } catch (error) {
    console.error(`[Retrieval] Search failed on ${collectionName}:`, error);
    return [];
  }
}

// --- Result Mapping ---

function mapResultToSource(
  result: Record<string, unknown>,
  collectionName: string
): RetrievalSource {
  const collectionType = collectionName.toLowerCase() as
    | 'chunk'
    | 'summary'
    | 'qa';

  let content = '';

  switch (collectionType) {
    case 'chunk':
      content = (result.text as string) ?? '';
      break;
    case 'summary':
      content = (result.summary as string) ?? '';
      break;
    case 'qa':
      content = formatQAContent(
        (result.question as string) ?? '',
        (result.answer as string) ?? ''
      );
      break;
  }

  return {
    title: (result.title as string) ?? 'Untitled',
    content,
    refLink: (result.ref_link as string) ?? undefined,
    collection: collectionType,
    score: (result.score as number) ?? 0,
    language: (result.language as string) ?? undefined
  };
}

function formatQAContent(question: string, answer: string): string {
  return `Q: ${question}\nA: ${answer}`;
}

// --- Context Building ---

function buildContextString(sources: RetrievalSource[]): string {
  if (sources.length === 0) return '';

  const sections: string[] = [];
  let currentLength = 0;

  const chunks = sources.filter((source) => source.collection === 'chunk');
  const summaries = sources.filter((source) => source.collection === 'summary');
  const qaItems = sources.filter((source) => source.collection === 'qa');

  if (qaItems.length > 0) {
    const qaSection = buildSection('Q&A FROM KNOWLEDGE BASE', qaItems);
    if (currentLength + qaSection.length <= MAX_CONTEXT_CHARS) {
      sections.push(qaSection);
      currentLength += qaSection.length;
    }
  }

  if (chunks.length > 0) {
    const chunkSection = buildSection('KNOWLEDGE CHUNKS', chunks);
    if (currentLength + chunkSection.length <= MAX_CONTEXT_CHARS) {
      sections.push(chunkSection);
      currentLength += chunkSection.length;
    }
  }

  if (summaries.length > 0) {
    const summarySection = buildSection('TOPIC SUMMARIES', summaries);
    if (currentLength + summarySection.length <= MAX_CONTEXT_CHARS) {
      sections.push(summarySection);
      currentLength += summarySection.length;
    }
  }

  return sections.join('\n\n');
}

function buildSection(heading: string, sources: RetrievalSource[]): string {
  const entries = sources
    .map((source) => `# ${source.title}\n${source.content.trim()}`)
    .join('\n\n---\n\n');

  return `### ${heading}\n${entries}`;
}

// --- Utilities ---

function deduplicateByTitle(sources: RetrievalSource[]): RetrievalSource[] {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const normalizedTitle = source.title.toLowerCase().trim();
    if (seen.has(normalizedTitle)) return false;
    seen.add(normalizedTitle);
    return true;
  });
}

function extractResults(
  settled: PromiseSettledResult<RetrievalSource[]>,
  collectionType: string
): RetrievalSource[] {
  if (settled.status === 'fulfilled') {
    return settled.value;
  }
  console.error(`[Retrieval] ${collectionType} search failed:`, settled.reason);
  return [];
}
