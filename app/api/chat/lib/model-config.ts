/**
 * Chat model configuration.
 * Parses available models from environment variables and provides
 * model-specific capability detection.
 *
 * Priority order: CHAT_MODELS (comma-separated) → CHAT_MODEL (single) → default.
 * Models listed first have highest priority and are tried first in fallback cascades.
 */

const DEFAULT_MODEL = 'gemma-3-27b-it';

/** Model prefixes that do NOT support the "system" role in chat completions */
const MODELS_WITHOUT_SYSTEM_ROLE = ['gemma-'];

/**
 * Returns the ordered list of chat models to try (highest priority first).
 * Reads from CHAT_MODELS env var (comma-separated), falls back to CHAT_MODEL.
 *
 * @example
 * // .env: CHAT_MODELS=gemini-3.1-flash-lite-preview,gemma-3-27b-it,gemini-2.0-flash
 * getChatModels() // → ['gemini-3.1-flash-lite-preview', 'gemma-3-27b-it', 'gemini-2.0-flash']
 */
export function getChatModels(): string[] {
  const rawModels = process.env.CHAT_MODELS ?? '';
  const parsed = rawModels
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  if (parsed.length > 0) return parsed;

  // Backward compatibility: single CHAT_MODEL
  return [process.env.CHAT_MODEL ?? DEFAULT_MODEL];
}

/**
 * Checks if a model supports the "system" role in chat completions.
 * Most OpenAI-compatible models (GPT, Gemini, DeepSeek, Qwen, Claude) support it.
 * Gemma family does NOT — system instructions must be merged into the user message.
 */
export function supportsSystemRole(model: string): boolean {
  return !MODELS_WITHOUT_SYSTEM_ROLE.some((prefix) => model.startsWith(prefix));
}
