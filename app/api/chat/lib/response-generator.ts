import { getApiKeyRotator } from "./api-key-rotator";

export function createStreamingResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>
): ReadableStream<Uint8Array> {
  const rotator = getApiKeyRotator();
  const apiKey = rotator.getNextApiKey();
  const baseUrl = process.env.API_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai";
  const model = process.env.CHAT_MODEL ?? "gemini-3.1-flash-live-preview";

  const payload = {
    model: model,
    messages: [
      { role: "system", content: systemPrompt },
      ...history
    ],
    stream: true,
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const body = await response.text();
          throw new Error(`LLM API error (status ${response.status}): ${body}`);
        }

        if (!response.body) {
          throw new Error("No response body from LLM API");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the incomplete line in the buffer
          buffer = lines.pop() ?? "";

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
      } catch (err: any) {
        console.error("[LLM Stream] Error:", err);
        // Transform errors into SSE messages so the client can display them gracefully if during stream
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ content: '\\n\\n⚠️ Rất tiếc, đã có sự cố với kết nối LLM.' })}\n\n`)
        );
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
        controller.close();
      }
    }
  });

  return stream;
}
