/**
 * Query Expansion Service — enriches short user queries with numerology-specific
 * keywords to improve hybrid search quality in Milvus.
 *
 * Uses system prompt + recent conversation history to understand the full context,
 * then generates additional search keywords appended to the original query.
 *
 * Example: "Xuân Ngọc Tường Vy ngày 1/3/1995"
 * → "Xuân Ngọc Tường Vy ngày 1/3/1995 con số chủ đạo đường đời biểu đồ ngày sinh
 *    năm cá nhân sứ mệnh linh hồn nhân cách life path number birth chart"
 */
import { getApiKeyRotator } from './api-key-rotator';

// --- Types ---

interface ChatMessage {
  role: string;
  content: string;
}

interface QueryExpansionContext {
  /** The current user query to expand */
  originalQuery: string;
  /** System prompt so the LLM understands the domain */
  systemPrompt: string;
  /** Recent conversation history (last N messages) for continuity */
  recentHistory: ChatMessage[];
}

// --- Configuration ---

/** Short queries below this threshold trigger expansion */
const EXPANSION_THRESHOLD = 80;

/** Max recent messages to include for context */
const MAX_HISTORY_ITEMS = 4;

const EXPANSION_INSTRUCTION = `You are a search keyword generator for a knowledge base retrieval system.

Your task: Given the domain context (provided as <domain_context>) and the user's latest query, generate ONLY additional search keywords that will help retrieve the most relevant documents.

Rules:
- Output ONLY search keywords/phrases separated by spaces. No explanation, no markdown, no punctuation, no numbering.
- DO NOT repeat the user's original query. Your output will be APPENDED to it.
- Analyze the <domain_context> to understand the domain and its terminology, then generate domain-specific keywords relevant to the user's query.
- Generate keywords in both the user's language and English for cross-language retrieval.
- If conversation history is provided, use it to understand what the user is specifically asking about and narrow the keywords accordingly.
- Keep output under 100 words.
- If the user query is already rich with keywords, output an empty string.`;

// --- Main ---

/**
 * Expands a short user query by appending LLM-generated search keywords.
 * Uses system prompt + conversation history for context-aware expansion.
 * Falls back to original query on any error (non-blocking).
 */
export async function expandQueryForRetrieval(
  context: QueryExpansionContext
): Promise<string> {
  const { originalQuery, systemPrompt, recentHistory } = context;

  // Skip expansion for already-detailed queries
  if (originalQuery.length >= EXPANSION_THRESHOLD) {
    console.log(
      '[QueryExpansion] Query is detailed enough, skipping expansion'
    );
    return originalQuery;
  }

  const rotator = getApiKeyRotator();
  const apiKey = rotator.getNextApiKey();
  const baseUrl =
    process.env.API_BASE_URL ??
    'https://generativelanguage.googleapis.com/v1beta/openai';

  try {
    console.time('[Perf] Query Expansion');

    // Build context-aware messages for the expansion LLM
    const expansionMessages = buildExpansionMessages(
      systemPrompt,
      recentHistory,
      originalQuery
    );

    const response = await fetch(
      `${baseUrl.replace(/\/$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.CHAT_MODEL ?? 'gemma-3-27b-it',
          messages: expansionMessages,
          max_tokens: 200,
          temperature: 0.2
        })
      }
    );

    if (!response.ok) {
      rotator.reportFailure(apiKey);
      console.warn(
        `[QueryExpansion] LLM call failed (status ${response.status}), using original query`
      );
      return originalQuery;
    }

    rotator.reportSuccess(apiKey);
    const data = await response.json();
    const generatedKeywords = data.choices?.[0]?.message?.content?.trim() ?? '';

    console.timeEnd('[Perf] Query Expansion');

    if (!generatedKeywords) {
      console.log(
        '[QueryExpansion] No keywords generated, using original query'
      );
      return originalQuery;
    }

    // Append keywords to original query (not replace)
    const expandedQuery = `${originalQuery} ${generatedKeywords}`;
    console.log(
      `[QueryExpansion] "${originalQuery.slice(0, 40)}..." + keywords: "${generatedKeywords.slice(0, 80)}..."`
    );

    return expandedQuery;
  } catch (error) {
    console.warn(
      '[QueryExpansion] Expansion failed, using original query:',
      error
    );
    return originalQuery;
  }
}

// --- Helpers ---

/**
 * Builds the message array for the expansion LLM call.
 * Includes a condensed system context + recent history so the LLM
 * understands the domain and ongoing conversation.
 */
function buildExpansionMessages(
  systemPrompt: string,
  history: ChatMessage[],
  currentQuery: string
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const model = process.env.CHAT_MODEL ?? 'gemma-3-27b-it';

  // Models that don't support "system" role (same list as response-generator)
  const MODELS_WITHOUT_SYSTEM_ROLE = ['gemma-'];
  const supportsSystemRole = !MODELS_WITHOUT_SYSTEM_ROLE.some((prefix) =>
    model.startsWith(prefix)
  );

  // Inject domain context as a condensed reference (truncate to save tokens)
  const condensedSystemPrompt = systemPrompt.slice(0, 2000);

  if (supportsSystemRole) {
    messages.push({ role: 'system', content: EXPANSION_INSTRUCTION });
    messages.push({
      role: 'user',
      content: `<domain_context>\n${condensedSystemPrompt}\n</domain_context>`
    });
  } else {
    // Merge instruction + domain context into first user message for Gemma
    messages.push({
      role: 'user',
      content: `${EXPANSION_INSTRUCTION}\n\n<domain_context>\n${condensedSystemPrompt}\n</domain_context>`
    });
  }

  messages.push({
    role: 'assistant',
    content:
      'Understood. I will generate search keywords based on this domain context.'
  });

  // Include recent conversation history for continuity
  const recentMessages = history.slice(-MAX_HISTORY_ITEMS);
  if (recentMessages.length > 0) {
    const historyText = recentMessages
      .map((message) => `${message.role}: ${message.content.slice(0, 300)}`)
      .join('\n');

    messages.push({
      role: 'user',
      content: `<recent_conversation>\n${historyText}\n</recent_conversation>`
    });
    messages.push({
      role: 'assistant',
      content:
        'Noted. I will consider this conversation context for keyword generation.'
    });
  }

  // The actual query to expand
  messages.push({
    role: 'user',
    content: `Generate search keywords for this user query: "${currentQuery}"`
  });

  return messages;
}
