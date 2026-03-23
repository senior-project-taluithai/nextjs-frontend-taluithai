"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

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
  allocationPercentages?: Record<string, number>;
  tripType?: string;
}

export interface HotelPrice {
  provider: string;
  price: number;
  link: string;
}

export interface HotelItem {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  priceRange: string;
  thumbnail: string;
  website: string;
  bookingUrl: string;
  prices: HotelPrice[];
  imageUrls: string[];
  amenities: string[];
}

export interface HotelData {
  hotels: HotelItem[];
}

export interface RouteStop {
  type: "start" | "place" | "hotel";
  name: string;
  lat: number;
  lng: number;
  pg_place_id?: number;
  hotel_id?: string;
  category?: string;
}

export interface ItineraryDay {
  day: number;
  transit_advice: string | null;
  route: RouteStop[];
  daily_distance_km: number;
  daily_duration_mins: number;
  geometry: { type: string; coordinates: [number, number][] } | null;
}

export interface RouteData {
  planId?: number;
  itinerary: ItineraryDay[];
  summary: {
    total_driving_distance_km: number;
    total_driving_duration_mins: number;
    hotels_used: { name: string; nights: number }[];
  };
}

export interface DayGeometry {
  day: number;
  geometry: { type: string; coordinates: [number, number][] };
}

export interface RoutePlanResponse {
  id: number;
  destinationProvince: string;
  numDays: number;
  dayGeometries: DayGeometry[];
  routeData: {
    itinerary: Omit<ItineraryDay, "geometry">[];
    summary: {
      total_driving_distance_km: number;
      total_driving_duration_mins: number;
      hotels_used: { name: string; nights: number }[];
    };
  };
  totalDistanceKm: number;
  totalDurationMins: number;
  createdAt: string;
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
  hotelData: HotelData | null;
  routeData: RouteData | null;
  routePlanId: number | null;
  selectedHotelIndexes: Set<number>;
  hotelAssignments: Record<number, number>;
  setRouteData: (data: RouteData | null) => void;
  setRoutePlanId: (id: number | null) => void;
  fetchRoutePlanById: (planId: number) => Promise<RouteData | null>;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  updateThreadId: (id: string | null) => void;
  loadConversation: (
    messages: ChatMessage[],
    threadId: string | null,
    conversationId?: string,
  ) => Promise<void>;
  reset: () => void;
  onSelectHotel: (index: number) => void;
  onAssignHotel: (night: number, hotelIndex: number) => void;
  onSelectAllHotels: () => void;
  optimizeHotelAssignments: () => void;
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
  const budgetDataRef = useRef(budgetData);
  budgetDataRef.current = budgetData;
  const [hotelData, setHotelData] = useState<HotelData | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routePlanId, setRoutePlanIdState] = useState<number | null>(null);
  const [selectedHotelIndexes, setSelectedHotelIndexes] = useState<Set<number>>(
    new Set(),
  );
  const [hotelAssignments, setHotelAssignments] = useState<
    Record<number, number>
  >({});
  const abortRef = useRef<AbortController | null>(null);

  const fetchRoutePlanById = useCallback(
    async (planId: number): Promise<RouteData | null> => {
      try {
        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${BACKEND_URL}/route-plans/${planId}`);
        if (!res.ok) return null;

        const data: RoutePlanResponse = await res.json();

        const routeDataFromPlan: RouteData = {
          planId: data.id,
          itinerary: data.dayGeometries.map((dg) => ({
            day: dg.day,
            transit_advice: null,
            route: [],
            daily_distance_km: 0,
            daily_duration_mins: 0,
            geometry: dg.geometry,
          })),
          summary: data.routeData?.summary || {
            total_driving_distance_km: data.totalDistanceKm,
            total_driving_duration_mins: data.totalDurationMins,
            hotels_used: [],
          },
        };

        return routeDataFromPlan;
      } catch (err) {
        console.warn("Failed to fetch route plan:", err);
        return null;
      }
    },
    [],
  );

  const setRoutePlanId = useCallback((id: number | null) => {
    setRoutePlanIdState(id);
  }, []);

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
        // Pass existing data as context so the agent can modify rather than recreate
        let userContent = content.trim();
        const contextBlocks: string[] = [];

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
          contextBlocks.push(
            `[CURRENT_TRIP]\n\`\`\`json\n${tripContext}\n\`\`\``,
          );
        }

        if (budgetData) {
          const budgetContext = JSON.stringify({
            total: budgetData.total,
            suggested_spent: budgetData.suggested_spent,
            categories: budgetData.categories,
            dailyBudgets: budgetData.dailyBudgets,
            expenses: budgetData.expenses,
          });
          contextBlocks.push(
            `[CURRENT_BUDGET]\n\`\`\`json\n${budgetContext}\n\`\`\``,
          );
        }

        if (hotelData) {
          const hotelContext = JSON.stringify({
            hotels: hotelData.hotels.map((h) => ({
              name: h.name,
              address: h.address,
              latitude: h.latitude,
              longitude: h.longitude,
              rating: h.rating,
              priceRange: h.priceRange,
              amenities: h.amenities,
            })),
          });
          contextBlocks.push(
            `[CURRENT_HOTELS]\n\`\`\`json\n${hotelContext}\n\`\`\``,
          );
        }

        if (contextBlocks.length > 0) {
          userContent = `${contextBlocks.join("\n\n")}\n\n[USER_REQUEST]\n${content.trim()}`;
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
        let currentEventType = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEventType = line.slice(7).trim();
              continue;
            }

            if (!line.startsWith("data: ")) continue;
            const dataStr = line.slice(6);

            try {
              const data = JSON.parse(dataStr);

              // Process the final 'values' event — contains complete state from all agents
              if (currentEventType === "values") {
                // Prefer direct state properties from backend (reliable for modifications)
                // Backend sends currentTrip, currentBudget, currentHotels in values event
                const currentTrip = data.currentTrip as PlannedTrip | undefined;
                const currentBudget = data.currentBudget as
                  | BudgetData
                  | undefined;
                const currentHotelsRaw = data.currentHotels as unknown;

                if (
                  currentTrip &&
                  Array.isArray(currentTrip.days) &&
                  currentTrip.days.length > 0
                ) {
                  setTripData(currentTrip);
                }
                if (currentBudget && typeof currentBudget.total === "number") {
                  setBudgetData(currentBudget);
                }
                if (
                  currentHotelsRaw &&
                  typeof currentHotelsRaw === "object" &&
                  currentHotelsRaw !== null
                ) {
                  const hotelsObj = currentHotelsRaw as {
                    hotels?: HotelItem[];
                  };
                  if (
                    Array.isArray(hotelsObj.hotels) &&
                    hotelsObj.hotels.length > 0
                  ) {
                    setHotelData({ hotels: hotelsObj.hotels });
                  }
                }

                // Fallback: parse from AI message content (for initial trip creation)
                // Only use this if backend didn't send direct state properties
                const msgs = Array.isArray(data.messages) ? data.messages : [];
                const allAiText = msgs
                  .filter(
                    (m: Record<string, unknown>) =>
                      m.type === "ai" &&
                      typeof m.content === "string" &&
                      m.content,
                  )
                  .map((m: Record<string, unknown>) => m.content as string)
                  .join("\n\n");

                if (allAiText) {
                  // Only parse from markdown if no direct state was provided
                  if (!currentTrip || !currentTrip.days?.length) {
                    const trip = extractTripFromMarkdown(allAiText);
                    if (trip) setTripData(trip);
                  }
                  if (!currentBudget) {
                    const budget = extractBudgetFromMarkdown(allAiText);
                    if (budget) setBudgetData(budget);
                  }
                  if (
                    !currentHotelsRaw ||
                    typeof currentHotelsRaw !== "object"
                  ) {
                    const hotel = extractHotelFromMarkdown(allAiText);
                    if (hotel) setHotelData(hotel);
                  }
                  const route = extractRouteFromMarkdown(allAiText);
                  if (route) setRouteData(route);

                  // Update chat message with clean text (strip JSON code blocks)
                  const cleanText = allAiText
                    .replace(/```(?:json)?\s*\n[\s\S]*?```/g, "")
                    .replace(/\n{3,}/g, "\n\n")
                    .trim();
                  if (cleanText) {
                    fullText = cleanText;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMsgId
                          ? { ...m, content: cleanText }
                          : m,
                      ),
                    );
                  }
                }
              }

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

                  // Extract hotels from searchHotels tool output instantly
                  if (toolName === "searchHotels") {
                    const outputContent =
                      data?.data?.output?.kwargs?.content ||
                      data?.data?.output?.content ||
                      data?.data?.output;
                    if (typeof outputContent === "string") {
                      try {
                        const parsed = JSON.parse(outputContent);
                        if (
                          parsed &&
                          typeof parsed === "object" &&
                          Array.isArray(parsed.hotels) &&
                          parsed.hotels.length > 0
                        ) {
                          setHotelData({ hotels: parsed.hotels });
                        }
                      } catch {
                        // Not valid JSON, ignore
                      }
                    }
                  }
                }
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Try to extract trip/budget/hotel data from streamed text
        const extracted = extractTripFromMarkdown(fullText);
        if (extracted) {
          setTripData(extracted);
        }

        const extractedBudget = extractBudgetFromMarkdown(fullText);
        if (extractedBudget) {
          setBudgetData(extractedBudget);
        }

        const extractedHotel = extractHotelFromMarkdown(fullText);
        if (extractedHotel) {
          setHotelData(extractedHotel);
        }

        const extractedRoute = extractRouteFromMarkdown(fullText);
        if (extractedRoute) {
          setRouteData(extractedRoute);
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
    [isStreaming, threadId, tripData, budgetData, hotelData],
  );

  const updateThreadId = useCallback((id: string | null) => {
    setThreadIdState(id);
  }, []);

  const loadConversation = useCallback(
    async (
      loadedMessages: ChatMessage[],
      loadedThreadId: string | null,
      conversationId?: string,
    ) => {
      setMessages(loadedMessages);
      setThreadIdState(loadedThreadId);
      setTripData(null);
      setBudgetData(null);
      setHotelData(null);
      setRouteData(null);

      // Try to fetch persisted agent state first
      if (conversationId || loadedThreadId) {
        try {
          const BACKEND_URL =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
          const stateId = conversationId || loadedThreadId;
          const stateRes = await fetch(`${BACKEND_URL}/chat/${stateId}/state`, {
            credentials: "include",
          });

          if (stateRes.ok) {
            const state = await stateRes.json();

            // Use persisted state preferentially over markdown parsing
            if (
              state?.currentTrip &&
              Array.isArray(state.currentTrip.days) &&
              state.currentTrip.days.length > 0
            ) {
              setTripData(state.currentTrip);
            }

            if (
              state?.currentBudget &&
              typeof state.currentBudget.total === "number"
            ) {
              setBudgetData(state.currentBudget);
            }

            if (
              state?.currentHotels &&
              Array.isArray(state.currentHotels.hotels)
            ) {
              setHotelData({ hotels: state.currentHotels.hotels });
            }

            // If we got persisted state, return early (no need to parse markdown)
            if (
              state?.currentTrip ||
              state?.currentBudget ||
              state?.currentHotels
            ) {
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to fetch agent state:", err);
        }
      }

      // Fallback: Extract trip/budget/hotel data from loaded messages
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

      const extractedHotel = extractHotelFromMarkdown(allText);
      if (extractedHotel) {
        setHotelData(extractedHotel);
      }

      const extractedRoute = extractRouteFromMarkdown(allText);
      if (extractedRoute) {
        setRouteData(extractedRoute);
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setThreadIdState(null);
    setTripData(null);
    setBudgetData(null);
    setHotelData(null);
    setRouteData(null);
    setSelectedHotelIndexes(new Set());
    setHotelAssignments({});
  }, []);

  const haversineKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const parsePriceRange = (priceRange: string): number => {
    if (!priceRange) return Infinity;
    const cleaned = priceRange.replace(/[฿,$,\s]/g, "").replace(/[^\d.-]/g, "");
    const parts = cleaned
      .split("-")
      .map((p) => parseFloat(p.trim()))
      .filter((n) => !isNaN(n) && isFinite(n));
    if (parts.length === 0) return Infinity;
    if (parts.length === 1) return parts[0];
    return (parts[0] + parts[1]) / 2;
  };

  const computeDayCentroids = (
    tripDays: PlannedTrip["days"],
  ): Map<number, { lat: number; lng: number }> => {
    const centroids = new Map<number, { lat: number; lng: number }>();
    for (const day of tripDays) {
      const placesWithCoords = day.items.filter(
        (i) => i.latitude && i.longitude,
      );
      if (placesWithCoords.length === 0) continue;
      const lat =
        placesWithCoords.reduce((sum, i) => sum + (i.latitude ?? 0), 0) /
        placesWithCoords.length;
      const lng =
        placesWithCoords.reduce((sum, i) => sum + (i.longitude ?? 0), 0) /
        placesWithCoords.length;
      centroids.set(day.day, { lat, lng });
    }
    return centroids;
  };

  const autoAssignHotels = useCallback(
    (
      selectedIndexes: Set<number>,
      trip: PlannedTrip,
      hotels: HotelData["hotels"],
    ) => {
      if (selectedIndexes.size === 0 || !trip.days || trip.days.length === 0) {
        setHotelAssignments({});
        return;
      }

      const centroids = computeDayCentroids(trip.days);
      const numNights = trip.days.length - 1;

      const assignments: Record<number, number> = {};

      for (let night = 1; night <= numNights; night++) {
        const centroid = centroids.get(night);
        if (!centroid) {
          assignments[night] = Array.from(selectedIndexes)[0];
          continue;
        }

        let bestHotelIdx = Array.from(selectedIndexes)[0];
        let bestDist = Infinity;

        for (const hotelIdx of selectedIndexes) {
          const hotel = hotels[hotelIdx];
          if (!hotel) continue;
          const dist = haversineKm(
            centroid.lat,
            centroid.lng,
            hotel.latitude,
            hotel.longitude,
          );
          if (dist < bestDist) {
            bestDist = dist;
            bestHotelIdx = hotelIdx;
          }
        }

        assignments[night] = bestHotelIdx;
      }

      setHotelAssignments(assignments);
    },
    [],
  );

  const onSelectHotel = useCallback((index: number) => {
    setSelectedHotelIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const onSelectAllHotels = useCallback(() => {
    if (!hotelData?.hotels) return;
    const allIndexes = new Set(hotelData.hotels.map((_, idx) => idx));
    setSelectedHotelIndexes(allIndexes);
  }, [hotelData]);

  const optimizeHotelAssignments = useCallback(() => {
    if (!tripData || !hotelData?.hotels || tripData.days.length === 0) return;

    const centroids = computeDayCentroids(tripData.days);
    const numNights = tripData.days.length - 1;

    if (numNights <= 0 || hotelData.hotels.length === 0) return;

    const allHotels = hotelData.hotels.map((h, idx) => ({
      ...h,
      idx,
    }));

    const avgPrice =
      allHotels.reduce((sum, h) => {
        const price = parsePriceRange(h.priceRange);
        return sum + (price === Infinity ? 0 : price);
      }, 0) / allHotels.length || 1;

    const assignments: Record<number, number> = {};

    for (let night = 1; night <= numNights; night++) {
      const centroid = centroids.get(night);
      const dayIndex = night;

      if (!centroid) {
        const bestByPrice = allHotels.reduce((best, h) => {
          const hPrice = parsePriceRange(h.priceRange);
          const bPrice = parsePriceRange(best.priceRange);
          return hPrice < bPrice ? h : best;
        }, allHotels[0]);
        assignments[night] = bestByPrice.idx;
        continue;
      }

      let bestHotel = allHotels[0];
      let bestScore = -Infinity;

      for (const hotel of allHotels) {
        const price = parsePriceRange(hotel.priceRange);
        const priceNorm = price === Infinity ? 1 : price / avgPrice;
        const priceScore = -priceNorm * 5;

        const distKm = haversineKm(
          centroid.lat,
          centroid.lng,
          hotel.latitude,
          hotel.longitude,
        );
        const distNorm = distKm / 100;
        const distScore = -distNorm * 4;

        const ratingScore = (hotel.rating || 0) * 1;

        const score = priceScore + distScore + ratingScore;

        if (score > bestScore) {
          bestScore = score;
          bestHotel = hotel;
        }
      }

      assignments[night] = bestHotel.idx;
    }

    setSelectedHotelIndexes(new Set(allHotels.map((h) => h.idx)));
    setHotelAssignments(assignments);

    const totalCost = Object.values(assignments).reduce((sum, idx) => {
      const h = hotelData.hotels[idx];
      const price = parsePriceRange(h.priceRange);
      return sum + (price === Infinity ? 0 : price);
    }, 0);

    if (totalCost > 0) {
      toast.success(
        `AI-Optimized: ฿${totalCost.toLocaleString()} total for ${numNights} night(s)`,
      );
    }
  }, [tripData, hotelData]);

  const recalculateBudgetWithHotels = useCallback(
    (
      budget: BudgetData,
      assignments: Record<number, number>,
      hotels: HotelData["hotels"],
      totalDays: number,
    ): BudgetData => {
      if (!assignments || Object.keys(assignments).length === 0) {
        return budget;
      }

      const accommodationCat = budget.categories.find((cat) => {
        const catIdLower = cat.id.toLowerCase();
        return (
          catIdLower.includes("accommodation") ||
          catIdLower.includes("hotel") ||
          catIdLower.includes("stay") ||
          catIdLower.includes("lodging") ||
          catIdLower.includes("room")
        );
      });
      const accommodationCatId = accommodationCat?.id;

      let totalAccommodationCost = 0;
      const newHotelExpenses: BudgetExpense[] = [];

      for (const [nightStr, hotelIdx] of Object.entries(assignments)) {
        const night = parseInt(nightStr);
        const hotel = hotels[hotelIdx];
        if (hotel) {
          const avgPrice = parsePriceRange(hotel.priceRange);
          if (avgPrice !== Infinity) {
            totalAccommodationCost += avgPrice;

            const expenseId = `hotel-expense-${night}-${hotelIdx}`;

            newHotelExpenses.push({
              id: expenseId,
              name: `${hotel.name} - Night ${night}`,
              amount: avgPrice,
              categoryId: accommodationCatId || "accommodation",
              day: night,
            });
          }
        }
      }

      const existingNonAccommodationExpenses =
        (budget.expenses || []).filter(
          (e) => e && e.id && e.categoryId !== accommodationCatId,
        ) || [];
      const allExpenses = [
        ...existingNonAccommodationExpenses,
        ...newHotelExpenses,
      ];

      const updatedCategories = budget.categories.map((cat) => {
        const catIdLower = cat.id.toLowerCase();
        if (
          catIdLower.includes("accommodation") ||
          catIdLower.includes("hotel") ||
          catIdLower.includes("stay") ||
          catIdLower.includes("lodging") ||
          catIdLower.includes("room")
        ) {
          return { ...cat, allocated: totalAccommodationCost };
        }
        return cat;
      });

      return {
        ...budget,
        categories: updatedCategories,
        expenses: allExpenses,
      };
    },
    [],
  );

  const onAssignHotel = useCallback((night: number, hotelIndex: number) => {
    setHotelAssignments((prev) => ({
      ...prev,
      [night]: hotelIndex,
    }));
  }, []);

  const prevAssignmentsRef = useRef<Record<number, number>>({});
  const prevSelectedHotelsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (hotelData?.hotels && tripData && selectedHotelIndexes.size > 0) {
      if (
        prevSelectedHotelsRef.current.size !== selectedHotelIndexes.size ||
        [...selectedHotelIndexes].some(
          (idx) => !prevSelectedHotelsRef.current.has(idx),
        )
      ) {
        prevSelectedHotelsRef.current = new Set(selectedHotelIndexes);
        autoAssignHotels(selectedHotelIndexes, tripData, hotelData.hotels);
      }
    }
  }, [hotelData, selectedHotelIndexes, tripData, autoAssignHotels]);

  useEffect(() => {
    if (!budgetData || !hotelData || !tripData) return;
    if (!hotelAssignments || Object.keys(hotelAssignments).length === 0) return;

    const assignmentsKey = JSON.stringify(hotelAssignments);
    const prevKey = JSON.stringify(prevAssignmentsRef.current);

    if (assignmentsKey !== prevKey) {
      prevAssignmentsRef.current = { ...hotelAssignments };

      let totalHotelCost = 0;
      for (const [, hotelIdx] of Object.entries(hotelAssignments)) {
        const hotel = hotelData.hotels[hotelIdx];
        if (hotel) {
          const price = parsePriceRange(hotel.priceRange);
          if (price !== Infinity) {
            totalHotelCost += price;
          }
        }
      }

      const updated = recalculateBudgetWithHotels(
        budgetData,
        hotelAssignments,
        hotelData.hotels,
        tripData.days.length,
      );
      setBudgetData(updated);

      if (totalHotelCost > 0) {
        toast.success(
          `Budget updated: ฿${totalHotelCost.toLocaleString()} for ${Object.keys(hotelAssignments).length} hotel night(s)`,
        );
      }
    }
  }, [
    budgetData,
    hotelAssignments,
    hotelData,
    tripData,
    recalculateBudgetWithHotels,
  ]);

  return {
    messages,
    isStreaming,
    threadId,
    tripData,
    budgetData,
    hotelData,
    routeData,
    routePlanId,
    selectedHotelIndexes,
    hotelAssignments,
    setRouteData,
    setRoutePlanId,
    fetchRoutePlanById,
    sendMessage,
    stop,
    updateThreadId,
    loadConversation,
    reset,
    onSelectHotel,
    onAssignHotel,
    onSelectAllHotels,
    optimizeHotelAssignments,
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
  // Try fenced code blocks first
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

  // Fallback: try to find unfenced JSON with budget keys
  const unfencedRegex =
    /\{[\s\S]*?"categories"\s*:\s*\[[\s\S]*?"expenses"\s*:\s*\[[\s\S]*?\]\s*\}/g;
  let unfencedMatch;
  while ((unfencedMatch = unfencedRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(unfencedMatch[0]);
      const budgetObject = findBudgetObject(parsed);
      if (budgetObject) {
        return parseBudgetData(budgetObject);
      }
    } catch {
      // not valid JSON
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

/**
 * Try to extract hotel data from the AI markdown response.
 * Looks for JSON code blocks with { hotels: [...] } structure.
 */
function extractHotelFromMarkdown(text: string): HotelData | null {
  // Try fenced code blocks first
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const hotelObject = findHotelObject(parsed);
      if (hotelObject) {
        return parseHotelData(hotelObject);
      }
    } catch {
      // not valid JSON, try next block
    }
  }

  // Fallback: try to find unfenced JSON with "hotels" key
  // This handles cases where JSON is truncated (missing closing ```)
  const unfencedRegex = /\{[\s\S]*?"hotels"\s*:\s*\[/g;
  let unfencedMatch;
  while ((unfencedMatch = unfencedRegex.exec(text)) !== null) {
    try {
      // Find the start of the JSON
      const startIdx = unfencedMatch.index;
      // Try to find a reasonable end point - look for }] or ]] or similar
      const possibleEnds = [
        text.indexOf("]}", startIdx),
        text.indexOf('"]', startIdx),
        text.indexOf("}\n", startIdx),
      ];
      let endIdx = -1;
      for (const idx of possibleEnds) {
        if (idx !== -1 && idx < startIdx + 50000) {
          // sanity limit
          endIdx = idx + 2;
          break;
        }
      }

      if (endIdx === -1) continue;

      const jsonStr = text.slice(startIdx, endIdx + 1);
      const parsed = JSON.parse(jsonStr);
      const hotelObject = findHotelObject(parsed);
      if (hotelObject) {
        return parseHotelData(hotelObject);
      }
    } catch {
      // not valid JSON
    }
  }

  return null;
}

function findHotelObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.hotels) && obj.hotels.length > 0) {
    // Verify at least one item looks like a hotel (has name and latitude/address)
    const first = obj.hotels[0] as Record<string, unknown>;
    if (first && typeof first.name === "string") {
      return obj;
    }
  }

  for (const nested of Object.values(obj)) {
    const found = findHotelObject(nested);
    if (found) return found;
  }

  return null;
}

function parseHotelData(raw: Record<string, unknown>): HotelData {
  const hotels = Array.isArray(raw.hotels)
    ? raw.hotels
        .filter(
          (h): h is Record<string, unknown> => !!h && typeof h === "object",
        )
        .map((h) => ({
          name: (typeof h.name === "string" && h.name) || "",
          address: (typeof h.address === "string" && h.address) || "",
          latitude: typeof h.latitude === "number" ? h.latitude : 0,
          longitude: typeof h.longitude === "number" ? h.longitude : 0,
          rating: typeof h.rating === "number" ? h.rating : 0,
          reviewCount: typeof h.reviewCount === "number" ? h.reviewCount : 0,
          priceRange: (typeof h.priceRange === "string" && h.priceRange) || "",
          thumbnail:
            sanitizeThumbnailUrl(h.thumbnail) ||
            sanitizeThumbnailUrl(h.thumbnail_url) ||
            "",
          website: (typeof h.website === "string" && h.website) || "",
          bookingUrl: (typeof h.bookingUrl === "string" && h.bookingUrl) || "",
          prices: Array.isArray(h.prices)
            ? h.prices
                .filter(
                  (p): p is Record<string, unknown> =>
                    !!p && typeof p === "object",
                )
                .map((p) => ({
                  provider:
                    (typeof p.provider === "string" && p.provider) || "",
                  price: typeof p.price === "number" ? p.price : 0,
                  link: (typeof p.link === "string" && p.link) || "",
                }))
            : [],
          imageUrls: Array.isArray(h.imageUrls)
            ? h.imageUrls.filter(
                (url): url is string =>
                  typeof url === "string" && url.length > 0,
              )
            : [],
          amenities: Array.isArray(h.amenities) ? h.amenities : [],
        }))
    : [];

  return { hotels };
}

/**
 * Try to extract route data from the AI markdown response.
 * Looks for JSON code blocks with { itinerary: [...], summary: {...} } structure.
 */
function extractRouteFromMarkdown(text: string): RouteData | null {
  // Try fenced code blocks first
  const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
  let match;
  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      const routeObject = findRouteObject(parsed);
      if (routeObject) {
        return parseRouteData(routeObject);
      }
    } catch {
      // not valid JSON, try next block
    }
  }

  // Fallback: try to find unfenced JSON with route keys
  const unfencedRegex =
    /\{[\s\S]*?"itinerary"\s*:\s*\[[\s\S]*?"summary"\s*:\s*\{[\s\S]*?}/g;
  let unfencedMatch;
  while ((unfencedMatch = unfencedRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(unfencedMatch[0]);
      const routeObject = findRouteObject(parsed);
      if (routeObject) {
        return parseRouteData(routeObject);
      }
    } catch {
      // not valid JSON
    }
  }

  return null;
}

function findRouteObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findRouteObject(item);
      if (found) return found;
    }
    return null;
  }

  const obj = value as Record<string, unknown>;
  // Check if this has itinerary array and summary object
  if (
    Array.isArray(obj.itinerary) &&
    obj.summary &&
    typeof obj.summary === "object"
  ) {
    return obj;
  }

  // Search one level deep
  for (const nested of Object.values(obj)) {
    if (nested && typeof nested === "object") {
      const found = findRouteObject(nested);
      if (found) return found;
    }
  }

  return null;
}

function parseRouteData(raw: Record<string, unknown>): RouteData {
  const toNum = (v: unknown): number => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };

  const itinerary = Array.isArray(raw.itinerary)
    ? raw.itinerary
        .filter(
          (d): d is Record<string, unknown> => !!d && typeof d === "object",
        )
        .map((d) => ({
          day: typeof d.day === "number" ? d.day : 1,
          transit_advice:
            typeof d.transit_advice === "string" ? d.transit_advice : null,
          route: Array.isArray(d.route)
            ? d.route.map((r: Record<string, unknown>) => ({
                type: (r.type as "start" | "place" | "hotel") || "place",
                name: (r.name as string) || "",
                lat: toNum(r.lat ?? r.latitude),
                lng: toNum(r.lng ?? r.longitude),
                pg_place_id: r.pg_place_id as number | undefined,
                hotel_id: r.hotel_id as string | undefined,
                category: r.category as string | undefined,
              }))
            : [],
          daily_distance_km: toNum(d.daily_distance_km),
          daily_duration_mins: toNum(d.daily_duration_mins),
          geometry:
            d.geometry && typeof d.geometry === "object"
              ? (d.geometry as {
                  type: string;
                  coordinates: [number, number][];
                })
              : null,
        }))
    : [];

  const summary =
    raw.summary && typeof raw.summary === "object"
      ? (raw.summary as Record<string, unknown>)
      : {};

  const hotels_used = Array.isArray(summary.hotels_used)
    ? summary.hotels_used.map((h: Record<string, unknown>) => ({
        name: (h.name as string) || "",
        nights: typeof h.nights === "number" ? h.nights : 1,
      }))
    : [];

  return {
    itinerary,
    summary: {
      total_driving_distance_km: toNum(summary.total_driving_distance_km),
      total_driving_duration_mins: toNum(summary.total_driving_duration_mins),
      hotels_used,
    },
  };
}
