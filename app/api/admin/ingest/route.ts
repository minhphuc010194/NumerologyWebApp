import { NextRequest, NextResponse } from 'next/server';
import {
  getMilvusClient,
  ensureCollectionExists,
  clearVerifiedCollection
} from '@/app/api/chat/lib/milvus-client';
import { generateEmbedding } from '@/app/api/chat/lib/embedding-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collection, data, secret } = body;

    // Simple protection for the ingest endpoint
    if (secret !== 'numerology-admin-123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!collection || !data) {
      return NextResponse.json(
        { error: 'Collection and data are required' },
        { status: 400 }
      );
    }

    // 1. Determine the text to embed based on the collection type
    let textToEmbed = '';
    const titlePrefix = data.title ? `Title: ${data.title}\n` : '';

    if (collection === 'Chunk') {
      const conceptsStr = Array.isArray(data.key_concepts)
        ? data.key_concepts.join(', ')
        : typeof data.key_concepts === 'string'
          ? data.key_concepts
          : '';
      textToEmbed = `${titlePrefix}Text: ${data.text || ''}\nKey Concepts: ${conceptsStr}`;
    } else if (collection === 'Summary') {
      textToEmbed = `${titlePrefix}Summary: ${data.summary || ''}`;
    } else if (collection === 'QA') {
      textToEmbed = `${titlePrefix}Q: ${data.question}\nA: ${data.answer}`;
    }

    if (!textToEmbed) {
      return NextResponse.json(
        { error: 'Source text for embedding is empty' },
        { status: 400 }
      );
    }

    // 2. Generate Dense Embedding via Gemini embedding service
    console.log(`[Admin Ingest] Generating embedding for ${collection}...`);
    const embedding = await generateEmbedding(textToEmbed);

    // 3. Prepare data payload
    // Note: Sparse embedding (BM25) is handled natively by Milvus server function based on the schema (if configured).
    const insertData = { ...data, embedding };

    // Ensure array types if needed (e.g., key_concepts for Chunk)
    if (collection === 'Chunk' && typeof insertData.key_concepts === 'string') {
      insertData.key_concepts = insertData.key_concepts
        .split(',')
        .map((k: string) => k.trim())
        .filter(Boolean);
    }

    if (collection === 'Chunk' && typeof insertData.chunk_index === 'string') {
      insertData.chunk_index = parseInt(insertData.chunk_index, 10) || 0;
    }

    // 4. Ensure Collection Exists & Insert into Milvus DB
    console.log(`[Admin Ingest] Inserting into ${collection}...`);
    await ensureCollectionExists(collection);
    const client = getMilvusClient();
    const res = await client.insert({
      collection_name: collection,
      data: [insertData]
    });

    // Zilliz SDK returns success object instead of throwing JS error, so we must check status Code
    if (
      res.status &&
      res.status.error_code &&
      res.status.error_code !== 'Success'
    ) {
      if (res.status.error_code === 'CollectionNotExists') {
        clearVerifiedCollection(collection);
      }
      console.error(`[Admin Ingest] Milvus Insert Error:`, res.status);
      throw new Error(
        `Milvus Insert Failed: ${res.status.reason || res.status.error_code}`
      );
    }

    console.log(`[Admin Ingest] Inserted [${collection}] successfully.`);

    return NextResponse.json({ success: true, result: res });
  } catch (error) {
    console.error('[Admin Ingest] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
