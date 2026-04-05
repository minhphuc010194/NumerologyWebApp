/**
 * Embedding service supporting Google Gemini and OpenRouter.
 * Generates dense vectors for semantic search.
 */
import { getApiKeyRotator } from "./api-key-rotator";

function getGeminiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ??
    "https://generativelanguage.googleapis.com/v1beta/openai"
  );
}

function getEmbeddingBaseUrl(): string {
  return (
    process.env.EMBEDDING_API_BASE_URL ??
    "https://openrouter.ai/api/v1"
  );
}

interface EmbeddingResponse {
  data: Array<{
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * Generate an embedding vector for the given text.
 * Uses custom API if EMBEDDING_API_KEY is present in .env, otherwise falls back to Gemini Rotator.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const embeddingModel =
    process.env.EMBEDDING_MODEL ?? "text-embedding-004";

  // Custom Embedding Path (OpenRouter etc.)
  if (process.env.EMBEDDING_API_KEY) {
    const response = await fetch(`${getEmbeddingBaseUrl()}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: embeddingModel,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Custom Embedding API error ${response.status}: ${errorBody}`);
    }

    const data: EmbeddingResponse = await response.json();
    if (!data.data?.[0]?.embedding) {
      throw new Error("Invalid embedding response structure from Custom API");
    }

    return data.data[0].embedding;
  }

  // Gemini Path (Rotator)
  const rotator = getApiKeyRotator();
  const maxRetries = rotator.totalKeys;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const apiKey = rotator.getNextApiKey();

    try {
      const response = await fetch(`${getGeminiBaseUrl()}/embeddings`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: text,
        }),
      });

      if (response.status === 429) {
        rotator.reportFailure(apiKey);
        console.warn(`[Embedding] Rate limited on key ...${apiKey.slice(-6)}, rotating`);
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Embedding API error ${response.status}: ${errorBody}`);
      }

      const data: EmbeddingResponse = await response.json();
      rotator.reportSuccess(apiKey);

      if (!data.data?.[0]?.embedding) {
        throw new Error("Invalid embedding response structure");
      }

      return data.data[0].embedding;
    } catch (error) {
      if (error instanceof Error && error.message.includes("Rate limited")) continue;
      rotator.reportFailure(apiKey);
      throw error;
    }
  }

  throw new Error("All API keys exhausted for embedding generation. Try again later.");
}
