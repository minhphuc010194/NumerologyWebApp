/**
 * Query Expansion Service — enriches short user queries with numerology-specific
 * keywords to improve hybrid search quality in Milvus.
 * Also detects the user's input language in the same LLM call (zero extra latency)
 * so downstream components can instruct the response LLM to reply in the user's language.
 *
 * Uses system prompt + recent conversation history to understand the full context,
 * then generates additional search keywords appended to the original query.
 *
 * Example: "Nguyen Van A 10/3/1995"
 * → expandedQuery: "Nguyen Van A 10/3/1995 con số chủ đạo đường đời biểu đồ ngày sinh
 *    năm cá nhân sứ mệnh linh hồn nhân cách life path number birth chart"
 * → detectedLanguage: "Vietnamese"
 */
import { getApiKeyRotator } from './api-key-rotator';
import { getChatModels, supportsSystemRole } from './model-config';

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

export interface QueryExpansionResult {
  /** Original query + appended keywords (or just the original if skipped) */
  expandedQuery: string;
  /** Language name detected from user input (e.g. "Vietnamese", "English") */
  detectedLanguage: string;
}

// --- Configuration ---

/** Short queries below this threshold trigger expansion */
const EXPANSION_THRESHOLD = 80;

/** Max recent messages to include for context */
const MAX_HISTORY_ITEMS = 4;

/** Fallback language when detection fails or is skipped */
const DEFAULT_LANGUAGE = 'Vietnamese';

const EXPANSION_INSTRUCTION = `You are a search keyword generator for a knowledge base retrieval system.

Your task: Given the domain context (provided as <domain_context>) and the user's latest query:
1. DETECT the language the user is writing in.
2. Generate additional search keywords to help retrieve the most relevant documents.

Rules for keywords:
- DO NOT repeat the user's original query. Your output will be APPENDED to it.
- Analyze the <domain_context> to understand the domain and its terminology, then generate domain-specific keywords relevant to the user's query.
- Generate keywords in both the user's language and English for cross-language retrieval.
- If conversation history is provided, use it to understand what the user is specifically asking about and narrow the keywords accordingly.
- Keep keywords under 100 words.
- If the user query is already rich with keywords, leave "keywords" as an empty string.

IMPORTANT: You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no code fences, no explanation):
{"language":"<detected language name in English, e.g. Vietnamese, English, Japanese>","keywords":"<space-separated search keywords>"}`;

// --- Main ---

/**
 * Expands a short user query by appending LLM-generated search keywords.
 * Simultaneously detects the user's input language (zero extra API calls).
 * Uses system prompt + conversation history for context-aware expansion.
 * Tries all available API keys and model fallbacks before giving up.
 * Falls back to original query on any error (non-blocking).
 */
export async function expandQueryForRetrieval(
  context: QueryExpansionContext
): Promise<QueryExpansionResult> {
  const { originalQuery, systemPrompt, recentHistory } = context;

  // Skip expansion for already-detailed queries but still detect language
  if (originalQuery.length >= EXPANSION_THRESHOLD) {
    console.log(
      '[QueryExpansion] Query is detailed enough, skipping expansion (language detection only)'
    );
    const detectedLanguage = detectLanguageHeuristic(originalQuery);
    return { expandedQuery: originalQuery, detectedLanguage };
  }

  const rotator = getApiKeyRotator();
  const models = getChatModels();
  const baseUrl =
    (process.env.API_BASE_URL && process.env.API_BASE_URL.trim() !== '')
      ? process.env.API_BASE_URL.trim()
      : 'https://generativelanguage.googleapis.com/v1beta/openai';

  try {
    console.time('[Perf] Query Expansion');

    for (const model of models) {
      const expansionMessages = buildExpansionMessages(
        systemPrompt,
        recentHistory,
        originalQuery,
        model
      );

      for (let attempt = 0; attempt < rotator.totalKeys; attempt++) {
        const apiKey = rotator.getNextApiKey();

        try {
          const response = await fetch(
            `${baseUrl.replace(/\/$/, '')}/chat/completions`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model,
                messages: expansionMessages,
                max_tokens: 250,
                temperature: 0.2
              })
            }
          );

          if (response.status === 429) {
            rotator.reportFailure(apiKey);
            console.warn(
              `[QueryExpansion] Rate limited on key ...${apiKey.slice(-6)} with model ${model}, rotating`
            );
            continue;
          }

          if (!response.ok) {
            rotator.reportFailure(apiKey);
            console.warn(
              `[QueryExpansion] API error (status ${response.status}) on key ...${apiKey.slice(-6)} with model ${model}`
            );
            continue;
          }

          rotator.reportSuccess(apiKey);
          const data = await response.json();
          const rawOutput = data.choices?.[0]?.message?.content?.trim() ?? '';

          console.timeEnd('[Perf] Query Expansion');

          // Parse structured JSON response
          const { keywords, language } = parseExpansionResponse(
            rawOutput,
            originalQuery
          );

          const expandedQuery = keywords
            ? `${originalQuery} ${keywords}`
            : originalQuery;

          console.log(
            `[QueryExpansion] model="${model}" | lang="${language}" | "${originalQuery}" + keywords: "${keywords || '(none)'}"`
          );

          return { expandedQuery, detectedLanguage: language };
        } catch (error) {
          rotator.reportFailure(apiKey);
          console.warn(
            `[QueryExpansion] Error on key ...${apiKey.slice(-6)} with model ${model}:`,
            error
          );
          continue;
        }
      }

      // All keys exhausted for this model
      console.warn(
        `[QueryExpansion] All keys exhausted for model "${model}", trying next model`
      );
    }

    // All models + keys exhausted — non-critical, fall back gracefully
    console.timeEnd('[Perf] Query Expansion');
    console.warn(
      '[QueryExpansion] All models and keys exhausted, using original query'
    );
    return {
      expandedQuery: originalQuery,
      detectedLanguage: detectLanguageHeuristic(originalQuery)
    };
  } catch (error) {
    console.warn(
      '[QueryExpansion] Expansion failed, using original query:',
      error
    );
    return {
      expandedQuery: originalQuery,
      detectedLanguage: detectLanguageHeuristic(originalQuery)
    };
  }
}

// --- Helpers ---

/**
 * Parses the structured JSON response from the LLM.
 * Handles edge cases: markdown fences, malformed JSON, plain text fallback.
 */
function parseExpansionResponse(
  rawOutput: string,
  originalQuery: string
): { keywords: string; language: string } {
  if (!rawOutput) {
    return { keywords: '', language: detectLanguageHeuristic(originalQuery) };
  }

  try {
    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    const cleanedOutput = rawOutput
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedOutput);

    return {
      keywords: (parsed.keywords ?? '').trim(),
      language: (parsed.language ?? DEFAULT_LANGUAGE).trim()
    };
  } catch {
    // JSON parse failed — treat entire output as keywords (backward compatible)
    console.warn(
      '[QueryExpansion] Failed to parse structured response, treating as plain keywords'
    );
    return {
      keywords: rawOutput,
      language: detectLanguageHeuristic(originalQuery)
    };
  }
}

/**
 * Lightweight heuristic language detection for fallback scenarios.
 * Checks for Vietnamese diacritics, CJK ranges, Cyrillic, etc.
 * Returns a human-readable language name.
 */
function detectLanguageHeuristic(text: string): string {
  // Vietnamese: check for common diacritical marks
  if (
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      text
    )
  ) {
    return 'Vietnamese';
  }

  // Japanese (Hiragana/Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return 'Japanese';
  }

  // Korean (Hangul)
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
    return 'Korean';
  }

  // Chinese (CJK Unified Ideographs — after Japanese check)
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return 'Chinese';
  }

  // Thai
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return 'Thai';
  }

  // Cyrillic (Russian, etc.)
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'Russian';
  }

  // Arabic
  if (/[\u0600-\u06FF]/.test(text)) {
    return 'Arabic';
  }

  // Default to English for Latin scripts without diacritics
  return 'English';
}

/**
 * Builds the message array for the expansion LLM call.
 * Includes a condensed system context + recent history so the LLM
 * understands the domain and ongoing conversation.
 * Adapts message structure based on model's system role support.
 */
function buildExpansionMessages(
  systemPrompt: string,
  history: ChatMessage[],
  currentQuery: string,
  model: string
): ChatMessage[] {
  const messages: ChatMessage[] = [];

  // Inject domain context as a condensed reference (truncate to save tokens)
  const condensedSystemPrompt = systemPrompt.slice(0, 2000);

  if (supportsSystemRole(model)) {
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
      'Understood. I will detect the language and generate search keywords based on this domain context. I will respond with a JSON object only.'
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
        'Noted. I will consider this conversation context for keyword generation and language detection.'
    });
  }

  // The actual query to expand
  messages.push({
    role: 'user',
    content: `Detect language and generate search keywords for this user query: "${currentQuery}"`
  });

  return messages;
}
