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

export interface BudgetCategory {
  id: string;
  name: string;
  color: string;
  allocated: number;
  spent: number;
}

export interface DailyBudget {
  day: number;
  allocated: number;
  spent: number;
}

export interface BudgetExpense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  day: number;
  note?: string;
}

export interface BudgetData {
  total: number;
  suggested_spent?: number;
  categories: BudgetCategory[];
  dailyBudgets?: DailyBudget[];
  expenses?: BudgetExpense[];
}

export interface PlannedDay {
  day: number;
  items: PlannedDayItem[];
}

export interface PlannedDayItem {
  id?: string;
  name: string;
  type: "place" | "event";
  latitude?: number;
  longitude?: number;
  startTime?: string;
  endTime?: string;
  raw_id?: number;
  pg_place_id?: number;
  event_id?: number;
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
  budgetData: BudgetData | null;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  updateThreadId: (id: string | null) => void;
  loadConversation: (messages: ChatMessage[], threadId: string | null) => void;
  reset: () => void;
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
  handler: (event: string, data: string) => void,
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
  const [threadId, setThreadIdState] = useState<string | null>(null);
  const [tripData, setTripData] = useState<PlannedTrip | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content: content.trim(),
      };
      const assistantMsgId = genId();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        toolCalls: [],
      };

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

        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

        // 1. Create or reuse thread
        let currentThreadId = threadId;
        if (!currentThreadId) {
          const threadRes = await fetch(`${BACKEND_URL}/agent/threads`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });
          if (!threadRes.ok) {
            throw new Error("Failed to create thread: " + threadRes.status);
          }
          const threadData = await threadRes.json();
          currentThreadId = threadData.thread_id;
          setThreadIdState(currentThreadId);
        }

        // 2. Stream response
        const res = await fetch(
          `${BACKEND_URL}/agent/threads/${currentThreadId}/runs/stream`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              input: { messages: [newMessage] },
              assistant_id: "travel_agent",
            }),
            signal: controller.signal,
          },
        );

        if (!res.ok || !res.body) {
          throw new Error("Chat request failed: " + res.status);
        }

        // Parse SSE from backend (LangGraph raw events)
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let currentEventType = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEventType = line.slice(7).trim();
              continue;
            }

            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6);

            try {
              const data = JSON.parse(dataStr);

              if (currentEventType === "events") {
                // Text chunks from the LLM
                if (data.event === "on_chat_model_stream") {
                  const tags = Array.isArray(data.tags) ? data.tags : [];
                  const isInsideTool = tags.some(
                    (t: string) => t === "graph:step:tools",
                  );
                  if (isInsideTool) continue;

                  const chunk = data?.data?.chunk;
                  const content = chunk?.content ?? chunk?.kwargs?.content;
                  if (content && typeof content === "string") {
                    fullText += content;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: fullText,
                              toolCalls: [...toolCalls],
                            }
                          : m,
                      ),
                    );
                  }
                }

                // Graph node started
                if (data.event === "on_chain_start") {
                  const tags = Array.isArray(data.tags) ? data.tags : [];
                  const isGraphStep = tags.some((t: string) =>
                    t.startsWith("graph:step:"),
                  );
                  const nodeName = data.name as string;
                  if (
                    isGraphStep &&
                    nodeName &&
                    !nodeName.startsWith("__") &&
                    nodeName !== "LangGraph"
                  ) {
                    const tc: ToolCall = {
                      id: data?.run_id || genId(),
                      name: nodeName,
                      state: "running",
                      input: {},
                    };
                    toolCalls.push(tc);
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: fullText,
                              toolCalls: [...toolCalls],
                            }
                          : m,
                      ),
                    );
                  }
                }

                // Graph node finished
                if (data.event === "on_chain_end") {
                  const tags = Array.isArray(data.tags) ? data.tags : [];
                  const isGraphStep = tags.some((t: string) =>
                    t.startsWith("graph:step:"),
                  );
                  const nodeName = data.name as string;
                  if (
                    isGraphStep &&
                    nodeName &&
                    !nodeName.startsWith("__") &&
                    nodeName !== "LangGraph"
                  ) {
                    const existing = toolCalls.find(
                      (t) => t.name === nodeName && t.state === "running",
                    );
                    if (existing) {
                      existing.state = "completed";
                      existing.output = null;
                    }
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? {
                              ...m,
                              content: fullText,
                              toolCalls: [...toolCalls],
                            }
                          : m,
                      ),
                    );
                  }
                }

                // Tool events
                if (data.event === "on_tool_start") {
                  const toolName = data?.name || "tool";
                  const tc: ToolCall = {
                    id: data?.run_id || genId(),
                    name: toolName,
                    state: "running",
                    input: data?.data?.input?.kwargs || data?.data?.input || {},
                  };
                  toolCalls.push(tc);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: fullText, toolCalls: [...toolCalls] }
                        : m,
                    ),
                  );
                }
                if (data.event === "on_tool_end") {
                  const toolName = data?.name || "tool";
                  const existing = toolCalls.find(
                    (t) => t.name === toolName && t.state === "running",
                  );
                  if (existing) {
                    existing.state = "completed";
                    existing.output = data?.data?.output || null;
                  }
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: fullText, toolCalls: [...toolCalls] }
                        : m,
                    ),
                  );
                }
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Try to extract trip data
        const extracted = extractTripFromMarkdown(fullText);
        if (extracted) {
          setTripData(extracted);
        }

        const extractedBudget = extractBudgetFromMarkdown(fullText);
        if (extractedBudget) {
          setBudgetData(extractedBudget);
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") {
          // User cancelled
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      m.content || "ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
                  }
                : m,
            ),
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, threadId, tripData],
  );

  const updateThreadId = useCallback((id: string | null) => {
    setThreadIdState(id);
  }, []);

  const loadConversation = useCallback(
    (loadedMessages: ChatMessage[], loadedThreadId: string | null) => {
      setMessages(loadedMessages);
      setThreadIdState(loadedThreadId);
      setTripData(null);
      setBudgetData(null);

      // Extract trip data from loaded messages
      const allText = loadedMessages
        .filter((m) => m.role === "assistant")
        .map((m) => m.content)
        .join("\n\n");

      const extracted = extractTripFromMarkdown(allText);
      if (extracted) {
        setTripData(extracted);
      }

      const extractedBudget = extractBudgetFromMarkdown(allText);
      if (extractedBudget) {
        setBudgetData(extractedBudget);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setThreadIdState(null);
    setTripData(null);
    setBudgetData(null);
  }, []);

  return {
    messages,
    isStreaming,
    threadId,
    tripData,
    budgetData,
    sendMessage,
    stop,
    updateThreadId,
    loadConversation,
    reset,
  };
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

  // Fallback: parse itinerary-style markdown (e.g. "วันที่ 1", "09:00")
  // so frontend can still render a trip when model forgets JSON.
  return extractTripFromOutline(text);
}

function extractTripFromOutline(text: string): PlannedTrip | null {
  const lines = text.split(/\r?\n/);
  const days: PlannedDay[] = [];
  let currentDay: PlannedDay | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const dayMatch = line.match(/(?:วันที่|วันที|day)\s*(\d+)/i);
    if (dayMatch) {
      currentDay = {
        day: Number(dayMatch[1]),
        items: [],
      };
      days.push(currentDay);
      continue;
    }

    if (!currentDay) continue;
    if (!/^[-*]\s+/.test(line)) continue;

    const cleaned = line
      .replace(/^[-*]\s+/, "")
      .replace(/\*\*/g, "")
      .trim();
    if (!cleaned) continue;

    const timeMatch = cleaned.match(/(\d{1,2}:\d{2})/);
    currentDay.items.push({
      id: String(Math.random()).slice(2, 11),
      name: cleaned,
      type: "place",
      startTime: timeMatch ? timeMatch[1] : undefined,
    });
  }

  if (days.length === 0) return null;
  if (days.every((d) => d.items.length === 0)) return null;

  return {
    name: "AI Trip",
    province: "",
    days,
  };
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
 * Try to extract budget data from the AI markdown response.
 * Looks for JSON code blocks with { total, categories } structure.
 */
function extractBudgetFromMarkdown(text: string): BudgetData | null {
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const budgetObject = findBudgetObject(parsed);
      if (budgetObject) {
        return parseBudgetData(budgetObject);
      }
    } catch {
      // not valid JSON, try next block
    }
  }
  return null;
}

function findBudgetObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findBudgetObject(item);
      if (found) return found;
    }
    return null;
  }

  const obj = value as Record<string, unknown>;
  if (typeof obj.total !== "undefined" && Array.isArray(obj.categories)) {
    return obj;
  }

  for (const nested of Object.values(obj)) {
    const found = findBudgetObject(nested);
    if (found) return found;
  }

  return null;
}

function parseBudgetData(raw: Record<string, unknown>): BudgetData {
  const toNum = (v: unknown): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };

  const categories = Array.isArray(raw.categories)
    ? raw.categories
        .filter(
          (c): c is Record<string, unknown> => !!c && typeof c === "object",
        )
        .map((c, idx) => ({
          id:
            (typeof c.id === "string" && c.id.trim()) ||
            (typeof c.name === "string" &&
              c.name.trim().toLowerCase().replace(/\s+/g, "-")) ||
            `category-${idx + 1}`,
          name:
            (typeof c.name === "string" && c.name.trim()) ||
            (typeof c.id === "string" && c.id.trim()) ||
            `Category ${idx + 1}`,
          color: (typeof c.color === "string" && c.color.trim()) || "#94a3b8",
          allocated: toNum(c.allocated),
          spent: toNum(c.spent),
        }))
    : [];

  const expenses = Array.isArray(raw.expenses)
    ? raw.expenses
        .filter(
          (e): e is Record<string, unknown> => !!e && typeof e === "object",
        )
        .map((e, idx) => ({
          id: (typeof e.id === "string" && e.id.trim()) || `exp-${idx + 1}`,
          name:
            (typeof e.name === "string" && e.name.trim()) ||
            `Expense ${idx + 1}`,
          amount: toNum(e.amount),
          categoryId:
            (typeof e.categoryId === "string" && e.categoryId.trim()) ||
            "other",
          day: typeof e.day === "number" ? e.day : 1,
          note: typeof e.note === "string" ? e.note : undefined,
        }))
    : [];

  const dailyBudgets = Array.isArray(raw.dailyBudgets)
    ? raw.dailyBudgets
        .filter(
          (d): d is Record<string, unknown> => !!d && typeof d === "object",
        )
        .map((d) => ({
          day: typeof d.day === "number" ? d.day : 1,
          allocated: toNum(d.allocated),
          spent: toNum(d.spent),
        }))
    : [];

  return {
    total: toNum(raw.total),
    suggested_spent: toNum(raw.suggested_spent) || undefined,
    categories,
    expenses,
    dailyBudgets: dailyBudgets.length > 0 ? dailyBudgets : undefined,
  };
}

/**
 * Allowed image hostnames — only trust URLs from our own data sources.
 */
const ALLOWED_IMAGE_HOSTNAMES = new Set([
  "lh3.googleusercontent.com",
  "streetviewpixels-pa.googleapis.com",
  "tatapi.tourismthailand.org",
  "www.tourismthailand.org",
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
  const toNum = (v: unknown): number | undefined => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const toStr = (v: unknown): string | undefined => {
    if (typeof v === "string") {
      const s = v.trim();
      return s ? s : undefined;
    }
    return undefined;
  };

  const days = parsed.days as Record<string, unknown>[];
  return {
    name: (parsed.name as string) || (parsed.tripName as string) || "AI Trip",
    province: (parsed.province as string) || "",
    days: days.map((d, idx) => ({
      day: (d.day as number) || idx + 1,
      items: Array.isArray(d.items)
        ? d.items.map((item: Record<string, unknown>) => {
            const rawType = toStr(item.type) || toStr(item.category) || "place";
            const type: "place" | "event" =
              rawType === "event" ? "event" : "place";
            return {
              id: String(Math.random()).slice(2, 11),
              name:
                toStr(item.name) ||
                toStr(item.title) ||
                toStr(item.place_name) ||
                toStr(item.poi_name) ||
                toStr(item.category) ||
                toStr(item.type) ||
                "",
              type,
              latitude: toNum(item.latitude) ?? toNum(item.lat),
              longitude:
                toNum(item.longitude) ?? toNum(item.lng) ?? toNum(item.lon),
              startTime:
                toStr(item.startTime) ||
                toStr(item.start_time) ||
                toStr(item.time),
              endTime: toStr(item.endTime) || toStr(item.end_time),
              pg_place_id:
                type === "place"
                  ? (toNum(item.pg_place_id) ?? toNum(item.raw_id))
                  : undefined,
              event_id:
                type === "event"
                  ? (toNum(item.event_id) ?? toNum(item.raw_id))
                  : undefined,
              rating: toNum(item.rating) ?? toNum(item.review_rating),
              category: toStr(item.category) || toStr(item.type),
              address: toStr(item.address),
              thumbnail_url: sanitizeThumbnailUrl(
                item.thumbnail_url ?? item.thumbnail,
              ),
            };
          })
        : [],
    })),
    budget: (parsed.budget as PlannedTrip["budget"]) || undefined,
  };
}
