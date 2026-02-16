"use client";

import { useState, useCallback, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  state: "running" | "completed" | "error";
  input?: Record<string, unknown>;
  output?: unknown;
}

export interface PlannedTrip {
  name: string;
  description?: string;
  province?: string;
  startDate?: string;
  endDate?: string;
  days: PlannedDay[];
  budget?: {
    total?: number;
    accommodation?: number;
    food?: number;
    transport?: number;
    activities?: number;
  };
}

export interface PlannedDay {
  day: number;
  items: PlannedDayItem[];
}

export interface PlannedDayItem {
  id?: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
  startTime?: string;
  endTime?: string;
  raw_id?: number;
  pg_place_id?: number;
  thumbnail_url?: string;
  rating?: number;
  category?: string;
  address?: string;
}

interface UseAgentChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  threadId: string | null;
  tripData: PlannedTrip | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
}

let messageCounter = 0;
function genId() {
  return "msg-" + Date.now() + "-" + ++messageCounter;
}

/**
 * Parse an SSE stream. Calls handler for each (event, data) pair.
 */
async function parseSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  handler: (event: string, data: string) => void
) {
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() || "";

    for (const part of parts) {
      let eventType = "message";
      let dataStr = "";
      for (const line of part.split("\n")) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          dataStr += line.slice(6);
        }
      }
      if (dataStr) {
        handler(eventType, dataStr);
      }
    }
  }
}

export function useAgentChat(): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [tripData, setTripData] = useState<PlannedTrip | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: ChatMessage = { id: genId(), role: "user", content: content.trim() };
      const assistantMsgId = genId();
      const assistantMsg: ChatMessage = { id: assistantMsgId, role: "assistant", content: "", toolCalls: [] };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      let fullText = "";
      const toolCalls: ToolCall[] = [];

      try {
        // If trip data exists, include it as context for modification requests
        let userContent = content.trim();
        if (tripData) {
          const tripContext = JSON.stringify({
            name: tripData.name,
            province: tripData.province,
            days: tripData.days.map((d) => ({
              day: d.day,
              items: d.items.map((i) => ({
                name: i.name,
                type: i.type,
                category: i.category,
                pg_place_id: i.pg_place_id,
                latitude: i.latitude,
                longitude: i.longitude,
                startTime: i.startTime,
                endTime: i.endTime,
                rating: i.rating,
                thumbnail_url: i.thumbnail_url,
              })),
            })),
          });
          userContent = `[CURRENT_TRIP]\n\`\`\`json\n${tripContext}\n\`\`\`\n\n[USER_REQUEST]\n${content.trim()}`;
        }

        // Only send the new message — the backend checkpointer handles history
        const newMessage = { role: "user" as const, content: userContent };

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [newMessage], threadId }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error("Chat request failed: " + res.status);
        }

        const reader = res.body.getReader();

        await parseSSE(reader, (event, dataStr) => {
          try {
            const data = JSON.parse(dataStr);

            switch (event) {
              case "text": {
                fullText += data.content || "";
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: fullText, toolCalls: [...toolCalls] } : m
                  )
                );
                break;
              }

              case "tool_start": {
                const tc: ToolCall = {
                  id: data.runId || genId(),
                  name: data.name || "tool",
                  state: "running",
                  input: data.input,
                };
                toolCalls.push(tc);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: fullText, toolCalls: [...toolCalls] } : m
                  )
                );
                break;
              }

              case "tool_end": {
                const existing = toolCalls.find(
                  (t) => t.name === data.name && t.state === "running"
                );
                if (existing) {
                  existing.state = "completed";
                  existing.output = data.output;
                } else {
                  toolCalls.push({
                    id: data.runId || genId(),
                    name: data.name || "tool",
                    state: "completed",
                    output: data.output,
                  });
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: fullText, toolCalls: [...toolCalls] } : m
                  )
                );
                break;
              }

              case "meta": {
                if (data.threadId) {
                  setThreadId(data.threadId);
                }
                break;
              }
            }
          } catch {
            // skip unparseable
          }
        });

        // Try to extract trip data
        const extracted = extractTripFromMarkdown(fullText);
        if (extracted) {
          setTripData(extracted);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: m.content || "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, threadId, tripData]
  );

  return { messages, isStreaming, threadId, tripData, sendMessage, stop };
}

/**
 * Try to extract trip/itinerary data from the AI's markdown response.
 * Looks for JSON code blocks with trip structure.
 */
function extractTripFromMarkdown(text: string): PlannedTrip | null {
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      // Find the trip object — could be at top level or nested (e.g., {plan_trip_response: {...}})
      const trip = findTripObject(parsed);
      if (trip) return trip;
    } catch {
      // not valid JSON, try next block
    }
  }
  return null;
}

function findTripObject(obj: Record<string, unknown>): PlannedTrip | null {
  if (!obj || typeof obj !== "object") return null;

  // Check if this object has a days array
  if (Array.isArray(obj.days)) {
    return parseTripData(obj);
  }

  // Search one level deep for a nested object with days
  for (const value of Object.values(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      if (Array.isArray(nested.days)) {
        return parseTripData(nested);
      }
    }
  }

  return null;
}

/**
 * Allowed image hostnames — only trust URLs from our own data sources.
 */
const ALLOWED_IMAGE_HOSTNAMES = new Set([
  "lh3.googleusercontent.com",
  "streetviewpixels-pa.googleapis.com",
  "images.unsplash.com",
  "picsum.photos",
  "fastly.picsum.photos",
]);

function sanitizeThumbnailUrl(url: unknown): string | undefined {
  if (typeof url !== "string" || !url) return undefined;
  try {
    const u = new URL(url);
    if (u.protocol === "https:" && ALLOWED_IMAGE_HOSTNAMES.has(u.hostname)) {
      return url;
    }
  } catch {
    // invalid URL
  }
  return undefined;
}

function parseTripData(parsed: Record<string, unknown>): PlannedTrip {
  const days = parsed.days as Record<string, unknown>[];
  return {
    name: (parsed.name as string) || (parsed.tripName as string) || "AI Trip",
    province: (parsed.province as string) || "",
    days: days.map((d, idx) => ({
      day: (d.day as number) || idx + 1,
      items: Array.isArray(d.items)
        ? d.items.map((item: Record<string, unknown>) => ({
            id: String(Math.random()).slice(2, 11),
            name: (item.name as string) || "",
            type: (item.type as string) || "place",
            latitude: item.latitude as number | undefined,
            longitude: item.longitude as number | undefined,
            startTime: item.startTime as string | undefined,
            endTime: item.endTime as string | undefined,
            pg_place_id: item.pg_place_id as number | undefined,
            rating: item.rating as number | undefined,
            category: item.category as string | undefined,
            thumbnail_url: sanitizeThumbnailUrl(item.thumbnail_url),
          }))
        : [],
    })),
    budget: (parsed.budget as PlannedTrip["budget"]) || undefined,
  };
}
