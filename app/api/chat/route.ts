/**
 * Chat API route — RAG pipeline.
 * Flow: validate → embed → retrieve → generate (stream)
 *
 * POST /api/chat
 * Body: { messages: Array<{ role: string, content: string }> }
 * Response: SSE stream
 */
import { NextRequest } from 'next/server';

/**
 * Vercel Serverless config:
 * - maxDuration: Hobby = 60s max, Pro = 300s max. Prevents streaming from being killed mid-response.
 * - dynamic: Forces this route to always run as a serverless function, never statically cached.
 */
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
import { retrieveContext } from './lib/retrieval-service';
import { createStreamingResponse } from './lib/response-generator';
import { buildSystemPrompt } from './prompt';
import type { RetrievalSource } from './lib/retrieval-service';

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequestBody = await req.json();
    const { messages } = body;

    if (!messages?.length) {
      return new Response('Messages array is required', { status: 400 });
    }

    // Extract latest user message for retrieval
    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user');

    if (!latestUserMessage?.content?.trim()) {
      return new Response('No user message found', { status: 400 });
    }

    const userQuery = latestUserMessage.content.trim();

    // --- RAG Pipeline ---
    console.time('[Perf] Total RAG Retrieval');
    let ragContext = '';
    let sources: RetrievalSource[] = [];

    try {
      const retrievalResult = await retrieveContext(userQuery);
      console.timeEnd('[Perf] Total RAG Retrieval');
      console.log(
        'retrievalResult.content length',
        retrievalResult.context.length
      );
      console.log(
        'retrievalResult.sources length',
        retrievalResult.sources.length
      );
      ragContext = retrievalResult.context;
      sources = retrievalResult.sources;

      console.log(
        `[RAG] Retrieved ${sources.length} sources for query: "${userQuery.slice(0, 50)}..."`
      );
    } catch (error) {
      console.error(
        '[RAG] Retrieval failed, proceeding without context:',
        error
      );
      // Continue without RAG context — fallback to base knowledge
    }

    // Build system prompt with RAG context
    const systemPrompt = buildSystemPrompt(ragContext);

    // Prepare conversation history (limit to last 10 messages to control token usage)
    const conversationHistory = messages.slice(-15).map((message) => ({
      role: message.role,
      content: message.content
    }));

    // Create SSE stream
    const encoder = new TextEncoder();
    const llmStream = createStreamingResponse(
      systemPrompt,
      conversationHistory
    );

    // Wrap LLM stream to prepend sources metadata
    const outputStream = new ReadableStream({
      async start(controller) {
        // Send retrieval sources as first SSE event
        if (sources.length > 0) {
          const sourcesPayload = sources.map((source) => ({
            title: source.title,
            refLink: source.refLink,
            collection: source.collection,
            score: Math.round(source.score * 100) / 100
          }));

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'sources',
                sources: sourcesPayload
              })}\n\n`
            )
          );
        }

        // Pipe LLM stream
        const reader = llmStream.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
          controller.close();
        }
      }
    });

    return new Response(outputStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Content-Type-Options': 'nosniff'
      }
    });
  } catch (error) {
    console.error('[Chat API] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      status: 'ok',
      message: 'Chat RAG API. Use POST to send messages.'
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
