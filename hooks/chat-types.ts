/**
 * Shared types for the chat RAG system.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: RetrievalSourceInfo[];
  isStreaming?: boolean;
}

export interface RetrievalSourceInfo {
  title: string;
  refLink?: string;
  collection: "chunk" | "summary" | "qa";
  score: number;
}

export interface StreamChunk {
  id: string;
  role: "assistant";
  content: string;
  done: boolean;
}

export interface SourcesEvent {
  type: "sources";
  sources: RetrievalSourceInfo[];
}

export type SSEEvent = StreamChunk | SourcesEvent;

export function isSourcesEvent(event: SSEEvent): event is SourcesEvent {
  return "type" in event && event.type === "sources";
}
