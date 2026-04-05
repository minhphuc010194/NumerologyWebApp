/**
 * Custom hook for RAG chat — manages messages, streaming, and SSE parsing.
 * Replaces the previous `useChat` from ai/react with a purpose-built solution.
 */
"use client";
import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  RetrievalSourceInfo,
  SSEEvent,
} from "./chat-types";

type ChatPhase = "idle" | "searching" | "generating" | "error";

interface UseChatRAGReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  phase: ChatPhase;
  error: string | null;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

export function useChatRAG(): UseChatRAGReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [phase, setPhase] = useState<ChatPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>("");

  const isStreaming = phase === "searching" || phase === "generating";

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const trimmedContent = content.trim();
      lastUserMessageRef.current = trimmedContent;

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmedContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setPhase("searching");
      setError(null);

      // Prepare assistant placeholder
      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Abort previous request if any
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        // Build messages payload (all messages for context)
        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Response body is null");

        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedContent = "";
        let sources: RetrievalSourceInfo[] = [];
        let hasStartedGenerating = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const event: SSEEvent = JSON.parse(jsonStr);

              // Handle sources event
              if ("type" in event && event.type === "sources") {
                sources = event.sources;
                setPhase("generating");

                // Update assistant message with sources
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, sources } : m
                  )
                );
                continue;
              }

              // Handle content chunk
              if ("content" in event && event.content) {
                if (!hasStartedGenerating) {
                  hasStartedGenerating = true;
                  setPhase("generating");
                }

                accumulatedContent += event.content;

                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: accumulatedContent, sources }
                      : m
                  )
                );
              }

              // Handle done signal
              if ("done" in event && event.done) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, isStreaming: false, sources }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        setPhase("idle");
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setPhase("idle");
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        setPhase("error");

        // Update assistant message to show error
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: `⚠️ ${errorMessage}`,
                  isStreaming: false,
                }
              : m
          )
        );
      }
    },
    [messages, isStreaming, phase]
  );

  const clearMessages = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setPhase("idle");
    setError(null);
  }, []);

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    // Remove last assistant message (the error one)
    setMessages((prev) => {
      const lastAssistantIndex = prev.findLastIndex(
        (m) => m.role === "assistant"
      );
      if (lastAssistantIndex >= 0) {
        return prev.slice(0, lastAssistantIndex);
      }
      return prev;
    });

    // Also remove the last user message since sendMessage will re-add it
    setMessages((prev) => {
      const lastUserIndex = prev.findLastIndex((m) => m.role === "user");
      if (lastUserIndex >= 0) {
        return prev.slice(0, lastUserIndex);
      }
      return prev;
    });

    await sendMessage(lastUserMessageRef.current);
  }, [sendMessage]);

  return {
    messages,
    sendMessage,
    isStreaming,
    phase,
    error,
    clearMessages,
    retryLastMessage,
  };
}
