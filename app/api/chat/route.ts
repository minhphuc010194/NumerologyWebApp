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
import { checkRateLimit } from './lib/rate-limit';

interface IncomingMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];
}

export async function POST(req: NextRequest) {
  try {
    // --- Rate Limit Check ---
    // Get IP address for rate limiting
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1';
    
    // Check local in-memory limit: 5 requests / 60 giây
    const { success, limit, reset, remaining } = checkRateLimit(ip, 5, 60000);
    
    if (!success) {
      console.warn(`[RateLimit] IP ${ip} exceeded limit.`);
      return new Response(
        JSON.stringify({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau một lát.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }
    // ------------------------

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

    // Build base persona prompt (without RAG context — that comes after retrieval)
    const baseSystemPrompt = buildSystemPrompt();

    // Recent history for query expansion context (last 4 messages)
    const recentHistoryForExpansion = messages.slice(-4).map((message) => ({
      role: message.role,
      content: message.content
    }));

    // --- RAG Pipeline ---
    console.time('[Perf] Total RAG Retrieval');
    let ragContext = '';
    let sources: RetrievalSource[] = [];
    let detectedLanguage = 'Vietnamese'; // default fallback

    try {
      const retrievalResult = await retrieveContext(
        userQuery,
        baseSystemPrompt,
        recentHistoryForExpansion
      );
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
      detectedLanguage = retrievalResult.detectedLanguage;

      console.log(
        `[RAG] Retrieved ${sources.length} sources for query: "${userQuery}" | Language: ${detectedLanguage}`
      );
    } catch (error) {
      console.error(
        '[RAG] Retrieval failed, proceeding without context:',
        error
      );
      // Continue without RAG context — fallback to base knowledge
    }

    // Build system prompt with RAG context + language directive
    const systemPrompt = buildSystemPrompt(ragContext, detectedLanguage);

    // Prepare conversation history (limit to last 15 messages to control token usage)
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
