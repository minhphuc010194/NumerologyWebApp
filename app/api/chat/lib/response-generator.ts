import { getApiKeyRotator } from './api-key-rotator';

export function createStreamingResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>
): ReadableStream<Uint8Array> {
  const rotator = getApiKeyRotator();
  const baseUrl =
    process.env.API_BASE_URL ??
    'https://generativelanguage.googleapis.com/v1beta/openai';
  const model = process.env.CHAT_MODEL ?? 'gemma-3-27b-it';

  // Most OpenAI-compatible models support "system" role (GPT, DeepSeek, Qwen, Claude, Gemini...).
  // Only specific model families (e.g., Gemma on Google AI) do NOT support it.
  const MODELS_WITHOUT_SYSTEM_ROLE = ['gemma-'];
  const supportsSystemRole = !MODELS_WITHOUT_SYSTEM_ROLE.some((prefix) =>
    model.startsWith(prefix)
  );
  const messages = supportsSystemRole
    ? [{ role: 'system', content: systemPrompt }, ...history]
    : injectSystemPromptIntoHistory(systemPrompt, history);

  const payload = {
    model,
    messages,
    stream: true
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const maxRetries = Math.min(rotator.totalKeys, 3);
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
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
              `[LLM Stream] Rate limited on key ...${apiKey.slice(-6)}, rotating (attempt ${attempt + 1}/${maxRetries})`
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
              `[LLM Stream] API error on key ...${apiKey.slice(-6)}:`,
              lastError.message
            );
            continue;
          }

          if (!response.body) {
            throw new Error('No response body from LLM API');
          }

          // Successful connection — mark key as healthy
          rotator.reportSuccess(apiKey);

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
          return; // Successful — exit the retry loop
        } catch (err: any) {
          rotator.reportFailure(apiKey);
          lastError = err;
          console.error(
            `[LLM Stream] Error on key ...${apiKey.slice(-6)} (attempt ${attempt + 1}/${maxRetries}):`,
            err
          );
          continue;
        }
      }

      // All retries exhausted
      console.error('[LLM Stream] All API key retries exhausted:', lastError);
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ content: '\n\n⚠️ Sorry, there was a problem with the LLM connection. Please try again later.' })}\n\n`
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

