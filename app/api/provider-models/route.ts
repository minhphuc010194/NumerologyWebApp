/**
 * Proxy API to fetch available models from an external AI provider.
 * Avoids CORS issues when calling provider APIs directly from the browser.
 *
 * POST /api/provider-models
 * Body: { baseUrl: string, apiKey?: string, providerType: string }
 * Response: { models: string[] } | { error: string }
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface ProviderModelsRequest {
  baseUrl: string;
  apiKey?: string;
  providerType: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ProviderModelsRequest = await req.json();
    const { baseUrl, apiKey, providerType } = body;

    if (!baseUrl?.trim()) {
      return NextResponse.json(
        { error: 'Base URL is required' },
        { status: 400 }
      );
    }

    const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
    const modelsUrl = `${normalizedBaseUrl}/models`;

    // Build request headers based on provider type
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (providerType === 'anthropic') {
      // Anthropic uses x-api-key header and requires version
      if (apiKey) headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          error: `Provider returned ${response.status}: ${errorText.slice(0, 200)}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const models = extractModelIds(data, providerType);

    return NextResponse.json({ models });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to fetch models';
    console.error('[ProviderModels] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Extracts model IDs from various provider response formats.
 * OpenAI-compatible: { data: [{ id: "model-id" }] }
 * Anthropic: { data: [{ id: "model-id" }] }
 * Ollama: { models: [{ name: "model-name" }] } or OpenAI-compatible
 */
function extractModelIds(
  responseData: Record<string, unknown>,
  providerType: string
): string[] {
  // OpenAI-compatible format (OpenAI, OpenRouter, Google, Ollama v1)
  if (Array.isArray(responseData.data)) {
    return (responseData.data as Array<{ id?: string }>)
      .map((model) => model.id)
      .filter((id): id is string => Boolean(id))
      .sort();
  }

  // Ollama native format
  if (Array.isArray(responseData.models)) {
    return (responseData.models as Array<{ name?: string; model?: string }>)
      .map((model) => model.name ?? model.model)
      .filter((name): name is string => Boolean(name))
      .sort();
  }

  // Fallback: if response itself is an array
  if (Array.isArray(responseData)) {
    return (responseData as Array<{ id?: string; name?: string }>)
      .map((item) => item.id ?? item.name)
      .filter((id): id is string => Boolean(id))
      .sort();
  }

  return [];
}
