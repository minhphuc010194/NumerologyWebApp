/**
 * Types and presets for the custom AI provider system (BYOK).
 * Supports multiple providers: OpenAI, OpenRouter, Anthropic, Google, Grok, Ollama, Custom.
 */

// --- Provider Types ---

export type AIProviderType =
  | 'openai'
  | 'openrouter'
  | 'anthropic'
  | 'google'
  | 'grok'
  | 'ollama'
  | 'custom';

export interface AIProviderConfig {
  /** Unique identifier */
  id: string;
  /** Provider type determines default baseUrl and behavior */
  type: AIProviderType;
  /** User-defined display name (e.g. "My OpenAI Key") */
  label: string;
  /** API base URL (pre-filled from preset, editable) */
  baseUrl: string;
  /** List of API keys — supports round-robin when multiple */
  apiKeys: string[];
  /** Currently selected model ID */
  model: string;
  /** Models fetched from the provider's /models endpoint */
  availableModels: string[];
  /** Whether this provider is currently active for chat */
  isActive: boolean;
}

/**
 * Lightweight config sent with each chat API request.
 * Contains only what the server needs — no UI state.
 */
export interface ProviderRequestConfig {
  type: AIProviderType;
  baseUrl: string;
  apiKeys: string[];
  model: string;
}

// --- Provider Presets ---

export interface ProviderPreset {
  /** Human-readable provider name */
  label: string;
  /** Default API base URL */
  baseUrl: string;
  /** Path appended to baseUrl to fetch available models */
  modelsEndpoint: string;
  /** Whether API key is required (Ollama dev mode = false) */
  requiresApiKey: boolean;
  /** Placeholder text for the API key input */
  keyPlaceholder: string;
  /** Placeholder text for the custom URL input */
  urlPlaceholder: string;
}

export const PROVIDER_PRESETS: Record<AIProviderType, ProviderPreset> = {
  openai: {
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    modelsEndpoint: '/models',
    requiresApiKey: true,
    keyPlaceholder: 'sk-...',
    urlPlaceholder: 'https://api.openai.com/v1'
  },
  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsEndpoint: '/models',
    requiresApiKey: true,
    keyPlaceholder: 'sk-or-v1-...',
    urlPlaceholder: 'https://openrouter.ai/api/v1'
  },
  anthropic: {
    label: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    modelsEndpoint: '/models',
    requiresApiKey: true,
    keyPlaceholder: 'sk-ant-...',
    urlPlaceholder: 'https://api.anthropic.com/v1'
  },
  google: {
    label: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    modelsEndpoint: '/models',
    requiresApiKey: true,
    keyPlaceholder: 'AIzaSy...',
    urlPlaceholder:
      'https://generativelanguage.googleapis.com/v1beta/openai'
  },
  ollama: {
    label: 'Ollama',
    baseUrl: 'https://ollama.com/v1',
    modelsEndpoint: '/models',
    requiresApiKey: true,
    keyPlaceholder: 'Ollama Cloud API key (from ollama.com/settings/keys)',
    urlPlaceholder: 'https://ollama.com/v1 (cloud) or http://localhost:11434/v1 (local)'
  },
  grok: {
    label: 'Grok (xAI)',
    baseUrl: 'https://api.x.ai/v1',
    modelsEndpoint: '/models',
    requiresApiKey: true,
    keyPlaceholder: 'xai-...',
    urlPlaceholder: 'https://api.x.ai/v1'
  },
  custom: {
    label: 'Custom',
    baseUrl: '',
    modelsEndpoint: '/models',
    requiresApiKey: true,
    keyPlaceholder: 'your-api-key',
    urlPlaceholder: 'https://your-api.com/v1'
  }
};

/**
 * Extracts the request-safe config from a full provider config.
 * Strips UI-only fields (id, label, availableModels, isActive).
 */
export function toProviderRequestConfig(
  config: AIProviderConfig
): ProviderRequestConfig {
  return {
    type: config.type,
    baseUrl: config.baseUrl,
    apiKeys: config.apiKeys,
    model: config.model
  };
}

/** localStorage key for persisting provider configs */
export const PROVIDER_STORAGE_KEY = 'numerology-ai-providers';
