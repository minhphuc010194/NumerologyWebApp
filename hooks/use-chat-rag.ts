/**
 * Custom hook for RAG chat — manages multi-sessions, streaming, and SSE parsing.
 * Supports optional user-provided AI provider config (BYOK).
 */
'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { get, set, del } from 'idb-keyval';
import type {
  ChatMessage,
  RetrievalSourceInfo,
  SSEEvent,
  ChatSession
} from './chat-types';
import type { ProviderRequestConfig } from './provider-types';

type ChatPhase = 'idle' | 'searching' | 'generating' | 'error';

interface UseChatRAGReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isStreaming: boolean;
  phase: ChatPhase;
  error: string | null;
  retryLastMessage: () => Promise<void>;

  sessions: ChatSession[];
  currentSessionId: string | null;
  createNewSession: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  clearAllSessions: () => void;

  exportSessions: () => void;
  importSessions: (file: File) => Promise<void>;
}

const CHAT_STORE_KEY = 'numerology-chat-history';
const CHAT_ACTIVE_ID_KEY = 'numerology-active-chat-id';

export function useChatRAG(
  activeProviderConfig?: ProviderRequestConfig | null
): UseChatRAGReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [phase, setPhase] = useState<ChatPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');

  const isStreaming = phase === 'searching' || phase === 'generating';

  const saveToIDB = useCallback((newSessions: ChatSession[]) => {
    set(CHAT_STORE_KEY, newSessions).catch(console.error);
  }, []);

  // Sync hot messages to the active session
  const updateActiveSession = useCallback(
    (newMessages: ChatMessage[]) => {
      setMessages(newMessages);
      setSessions((prev) => {
        let nextSessions = [...prev];
        const idx = nextSessions.findIndex((s) => s.id === currentSessionId);

        if (idx >= 0) {
          nextSessions[idx] = {
            ...nextSessions[idx],
            messages: newMessages,
            updatedAt: new Date().toISOString()
          };
        } else if (currentSessionId && newMessages.length > 0) {
          // Create new session lazily on first message
          const title =
            newMessages.find((m) => m.role === 'user')?.content || 'New Chat';
          nextSessions.unshift({
            id: currentSessionId,
            title: title.slice(0, 40) + (title.length > 40 ? '...' : ''),
            updatedAt: new Date().toISOString(),
            messages: newMessages
          });
        }
        saveToIDB(nextSessions);
        return nextSessions;
      });
    },
    [currentSessionId, saveToIDB]
  );

  // Load from IndexedDB on mount
  useEffect(() => {
    Promise.all([get(CHAT_STORE_KEY), get(CHAT_ACTIVE_ID_KEY)]).then(([data, activeId]) => {
      if (data && Array.isArray(data) && data.length > 0) {
        if ('role' in data[0]) {
          // Legacy format migration
          const legacySession: ChatSession = {
            id: crypto.randomUUID(),
            title: 'Legacy Chat',
            updatedAt: new Date().toISOString(),
            messages: data as ChatMessage[]
          };
          setSessions([legacySession]);
          setCurrentSessionId(legacySession.id);
          setMessages(legacySession.messages);
          saveToIDB([legacySession]);
        } else {
          // New format
          const loaded = data as ChatSession[];
          setSessions(loaded);
          
          let targetSession = loaded[0];
          if (activeId && typeof activeId === 'string') {
            const found = loaded.find((s) => s.id === activeId);
            if (found) {
              targetSession = found;
            } else {
              // The activeId is not found in the saved session history. 
              // This means the user was on a "New Chat" (which is created lazily without saving).
              // We reconstruct that empty state for them to retain the URL/UI intention.
              targetSession = {
                id: activeId,
                title: 'New Chat',
                messages: [],
                updatedAt: new Date().toISOString()
              };
            }
          }
          
          setCurrentSessionId(targetSession.id);
          setMessages(targetSession.messages);
        }
      } else {
        createNewSession();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist current session ID
  useEffect(() => {
    if (currentSessionId) {
      set(CHAT_ACTIVE_ID_KEY, currentSessionId).catch(console.error);
    }
  }, [currentSessionId]);

  const createNewSession = useCallback(() => {
    abortControllerRef.current?.abort();
    setPhase('idle');
    setError(null);
    setMessages([]);
    setCurrentSessionId(crypto.randomUUID());
  }, []);

  const switchSession = useCallback(
    (id: string) => {
      abortControllerRef.current?.abort();
      const target = sessions.find((s) => s.id === id);
      if (target) {
        setCurrentSessionId(target.id);
        setMessages(target.messages);
        setPhase('idle');
        setError(null);
      }
    },
    [sessions]
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        saveToIDB(next);
        if (currentSessionId === id) {
          if (next.length > 0) {
            setCurrentSessionId(next[0].id);
            setMessages(next[0].messages);
          } else {
            setCurrentSessionId(crypto.randomUUID());
            setMessages([]);
          }
        }
        return next;
      });
    },
    [currentSessionId, saveToIDB]
  );

  const renameSession = useCallback(
    (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === id
            ? {
                ...s,
                title: newTitle.trim(),
                updatedAt: new Date().toISOString()
              }
            : s
        );
        saveToIDB(next);
        return next;
      });
    },
    [saveToIDB]
  );

  const clearAllSessions = useCallback(() => {
    abortControllerRef.current?.abort();
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(crypto.randomUUID());
    setPhase('idle');
    setError(null);
    del(CHAT_STORE_KEY).catch(console.error);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const trimmedContent = content.trim();
      lastUserMessageRef.current = trimmedContent;

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmedContent,
        timestamp: new Date()
      };

      let currentMessages = [...messages, userMessage];
      updateActiveSession(currentMessages);
      setPhase('searching');
      setError(null);

      // Prepare assistant placeholder
      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };

      currentMessages = [...currentMessages, assistantMessage];
      updateActiveSession(currentMessages);

      // Abort previous request if any
      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const apiMessages = currentMessages.slice(0, -1).map((m) => ({
          role: m.role,
          content: m.content
        }));

        const requestBody: Record<string, unknown> = { messages: apiMessages };
        if (activeProviderConfig) {
          requestBody.providerConfig = activeProviderConfig;
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is null');

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedContent = '';
        let sources: RetrievalSourceInfo[] = [];
        let hasStartedGenerating = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const event: SSEEvent = JSON.parse(jsonStr);

              // Handle sources event
              if ('type' in event && event.type === 'sources') {
                sources = event.sources;
                setPhase('generating');

                currentMessages = currentMessages.map((m) =>
                  m.id === assistantId ? { ...m, sources } : m
                );
                updateActiveSession(currentMessages);
                continue;
              }

              // Handle content chunk
              if ('content' in event && event.content) {
                if (!hasStartedGenerating) {
                  hasStartedGenerating = true;
                  setPhase('generating');
                }
                accumulatedContent += event.content;

                currentMessages = currentMessages.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: accumulatedContent, sources }
                    : m
                );
                updateActiveSession(currentMessages);
              }

              // Handle done signal
              if ('done' in event && event.done) {
                currentMessages = currentMessages.map((m) =>
                  m.id === assistantId
                    ? { ...m, isStreaming: false, sources }
                    : m
                );
                updateActiveSession(currentMessages);
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
        setPhase('idle');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setPhase('idle');
          return;
        }

        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setPhase('error');

        currentMessages = currentMessages.map((m) =>
          m.id === assistantId
            ? { ...m, content: `⚠️ ${errorMessage}`, isStreaming: false }
            : m
        );
        updateActiveSession(currentMessages);
      }
    },
    [messages, isStreaming, updateActiveSession, activeProviderConfig]
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current) return;

    let newMessages = [...messages];
    const lastAssistantIdx = newMessages.findLastIndex(
      (m) => m.role === 'assistant'
    );
    if (lastAssistantIdx >= 0) newMessages.splice(lastAssistantIdx, 1);

    const lastUserIdx = newMessages.findLastIndex((m) => m.role === 'user');
    if (lastUserIdx >= 0) newMessages.splice(lastUserIdx, 1);

    updateActiveSession(newMessages);
    await sendMessage(lastUserMessageRef.current);
  }, [messages, updateActiveSession, sendMessage]);

  const exportSessions = useCallback(() => {
    if (sessions.length === 0) return;

    // Strip metadata from exported messages (only keep chat history)
    const cleanSessions: ChatSession[] = sessions.map((session) => ({
      ...session,
      messages: session.messages.map((msg) => {
        const { sources, isStreaming, ...cleanMsg } = msg;
        return cleanMsg as ChatMessage;
      })
    }));

    const dataStr = JSON.stringify(cleanSessions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numerology-chat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sessions]);

  const importSessions = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsedData = JSON.parse(text) as ChatSession[];
        if (
          !Array.isArray(parsedData) ||
          (parsedData.length > 0 && !parsedData[0].updatedAt)
        ) {
          throw new Error('Invalid format');
        }

        // Sanitize incoming sessions by stripping any existing metadata
        const importedSessions: ChatSession[] = parsedData.map((session) => ({
          ...session,
          messages: session.messages.map((msg) => {
            const { sources, isStreaming, ...cleanMsg } = msg;
            return cleanMsg as ChatMessage;
          })
        }));

        setSessions(importedSessions);
        saveToIDB(importedSessions);
        if (importedSessions.length > 0) {
          setCurrentSessionId(importedSessions[0].id);
          setMessages(importedSessions[0].messages);
        }
      } catch (e) {
        throw new Error('Failed to parse chat memory file');
      }
    },
    [saveToIDB]
  );

  return {
    messages,
    sendMessage,
    isStreaming,
    phase,
    error,
    retryLastMessage,

    sessions,
    currentSessionId,
    createNewSession,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,

    exportSessions,
    importSessions
  };
}
