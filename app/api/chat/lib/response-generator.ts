import { getApiKeyRotator, createUserKeyRotator } from './api-key-rotator';
import { getChatModels, supportsSystemRole } from './model-config';

/** Optional user-provided provider config (BYOK) */
export interface UserProviderConfig {
  type?: string;
  baseUrl: string;
  apiKeys: string[];
  model: string;
}

export function createStreamingResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  userProviderConfig?: UserProviderConfig
): ReadableStream<Uint8Array> {
  // When user provides their own config, use their keys/model/url
  const isUserProvider = userProviderConfig && userProviderConfig.apiKeys.length > 0;
  const rotator = isUserProvider
    ? createUserKeyRotator(userProviderConfig.apiKeys)
    : getApiKeyRotator();
  const baseUrl = isUserProvider
    ? userProviderConfig.baseUrl.replace(/\/$/, '')
    : ((process.env.API_BASE_URL && process.env.API_BASE_URL.trim() !== '')
        ? process.env.API_BASE_URL.trim()
        : 'https://generativelanguage.googleapis.com/v1beta/openai');
  const models = isUserProvider
    ? [userProviderConfig.model]
    : getChatModels();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let lastError: Error | null = null;

      for (const model of models) {
        // Build messages based on current model's system role support
        const messages = supportsSystemRole(model)
          ? [{ role: 'system', content: systemPrompt }, ...history]
          : injectSystemPromptIntoHistory(systemPrompt, history);

        const payload = { model, messages, stream: true };

        // Try ALL available keys for this model before falling back
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
                body: JSON.stringify(payload)
              }
            );

            if (response.status === 429) {
              rotator.reportFailure(apiKey);
              console.warn(
                `[LLM Stream] Rate limited on key ...${apiKey.slice(-6)} with model ${model}, rotating (attempt ${attempt + 1}/${rotator.totalKeys})`
              );
              continue;
            }

            if (!response.ok) {
              const body = await response.text();
              rotator.reportFailure(apiKey);
              lastError = new Error(
                `LLM API error (status ${response.status}): ${body}`
              );
              console.error(
                `[LLM Stream] API error on key ...${apiKey.slice(-6)} with model ${model}:`,
                lastError.message
              );
              continue;
            }

            if (!response.body) {
              throw new Error('No response body from LLM API');
            }

            // Successful connection — mark key as healthy
            rotator.reportSuccess(apiKey);
            console.log(
              `[LLM Stream] Connected with model "${model}", key ...${apiKey.slice(-6)}`
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              // Keep the incomplete line in the buffer
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (line.trim() === '') continue;
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') continue;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      // Transform OpenAI format to our custom SSE format required by use-chat-rag.ts
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                      );
                    }
                  } catch (e) {
                    // Ignore JSON parsing errors for partial chunks
                  }
                }
              }
            }

            // Send the done event when the stream has cleanly finished
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
            );
            controller.close();
            return; // Successful — exit all loops
          } catch (err: any) {
            rotator.reportFailure(apiKey);
            lastError = err;
            console.error(
              `[LLM Stream] Error on key ...${apiKey.slice(-6)} with model ${model} (attempt ${attempt + 1}/${rotator.totalKeys}):`,
              err
            );
            continue;
          }
        }

        // All keys exhausted for this model — try next model in cascade
        console.warn(
          `[LLM Stream] All ${rotator.totalKeys} keys exhausted for model "${model}", falling back to next model`
        );
      }

      // All models + all keys exhausted
      console.error(
        `[LLM Stream] All ${models.length} models and ${rotator.totalKeys} keys exhausted:`,
        lastError
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ content: '\n\n⚠️ Tất cả các model và API key đều đã hết hạn mức. Vui lòng thử lại sau.' })}\n\n`
        )
      );
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
      );
      controller.close();
    }
  });

  return stream;
}

/**
 * For models that don't support "system" role, inject the system prompt
 * into the first user message as a clearly-delimited preamble.
 */
function injectSystemPromptIntoHistory(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>
): Array<{ role: string; content: string }> {
  const historyClone = history.map((message) => ({ ...message }));

  const firstUserIndex = historyClone.findIndex(
    (message) => message.role === 'user'
  );

  const systemPreamble = `<system_instructions>\n${systemPrompt}\n</system_instructions>\n\n`;

  if (firstUserIndex >= 0) {
    historyClone[firstUserIndex] = {
      ...historyClone[firstUserIndex],
      content: systemPreamble + historyClone[firstUserIndex].content
    };
  } else {
    // No user message found — prepend as a standalone user message
    historyClone.unshift({ role: 'user', content: systemPreamble });
  }

  return historyClone;
}
