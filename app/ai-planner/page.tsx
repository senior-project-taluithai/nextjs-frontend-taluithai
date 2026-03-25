"use client";

import { useState, useEffect, useRef } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { BackgroundMap } from "@/components/ai-planner/background-map";
import { TripResultPanel } from "@/components/ai-planner/trip-result-panel";
import { ChatHistorySidebar } from "@/components/ai-planner/chat-history-sidebar";
import { RouteLegend } from "@/components/my-trip/route-legend";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateTrip, useAddTripDayItem } from "@/hooks/api/useTrips";
import { useSetDayHotel } from "@/hooks/api/useHotels";
import { useChatConversation, useChatMessages } from "@/hooks/api/useChat";
import { useProvinces } from "@/hooks/api/useProvinces";
import { addDays, format } from "date-fns";
import {
  MapPin,
  Bot,
  Sparkles,
  Map,
  X,
  History,
  GripVertical,
} from "lucide-react";

import {
  useAgentChat,
  type PlannedTrip,
  type ToolCall,
} from "@/hooks/useAgentChat";
import { TripDayCards } from "@/components/ai-planner/trip-day-cards";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai/tool";
import { MessageResponse } from "@/components/ai/message";
import { Loader } from "@/components/ai/loader";

function getClientAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("auth_token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function stripJsonBlocks(text: string): string {
  let cleaned = text.replace(/```(?:json)?\s*\n[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/```(?:json)?\s*\n[\s\S]*$/g, "");
  cleaned = cleaned.replace(
    /^\s*(\{[\s\S]*?"(?:hotels|categories|expenses|dailyBudgets)"[\s\S]*)/gm,
    "",
  );
  return cleaned.trim();
}

function sanitizeMarkdownTables(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trimStart().startsWith("|")) {
      const rawBlock: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        rawBlock.push(lines[i]);
        i++;
      }

      const expanded: string[] = [];
      for (const row of rawBlock) {
        const parts = row.split(/\|\|/);
        if (parts.length > 1) {
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            const fixed =
              (trimmed.startsWith("|") ? "" : "| ") +
              trimmed +
              (trimmed.endsWith("|") ? "" : " |");
            expanded.push(fixed);
          }
        } else {
          expanded.push(row);
        }
      }

      const validRows = expanded.filter((row) => {
        const t = row.trim();
        return t.startsWith("|") && t.endsWith("|") && t.split("|").length >= 3;
      });

      if (validRows.length < 2) {
        result.push(...rawBlock);
        continue;
      }

      const headerCols = validRows[0].split("|").length;

      const cleanedRows: string[] = [];
      for (const row of validRows) {
        const cells = row.split("|").map((c) => c.trim());
        if (cells.length !== headerCols) continue;

        const cleanCells = cells.map((cell, idx) => {
          if (idx === 0 || idx === cells.length - 1) return cell;
          const numMatch = cell.match(/^(\d[\d,.]*)(?:[ก-๙a-zA-Z])/);
          if (numMatch) return numMatch[1];
          if (cell.length > 40 && !/^[-:\s]+$/.test(cell)) {
            const shortMatch = cell.match(
              /^(.{1,30}?)(?:\d\.\s|จัดขึ้น|เทศกาล|งาน|festival)/i,
            );
            if (shortMatch) return shortMatch[1].trim();
            return cell.slice(0, 30) + "…";
          }
          return cell;
        });

        cleanedRows.push("| " + cleanCells.slice(1, -1).join(" | ") + " |");
      }

      if (cleanedRows.length < 2) {
        result.push(...rawBlock);
        continue;
      }

      const sep = cleanedRows[1].trim();
      const isSep = /^\|[\s-:|]+\|$/.test(sep);
      if (!isSep) {
        const sepRow =
          "| " +
          Array(headerCols - 2)
            .fill("---")
            .join(" | ") +
          " |";
        cleanedRows.splice(1, 0, sepRow);
      }

      result.push(...cleanedRows);
    } else {
      result.push(line);
      i++;
    }
  }

  return result.join("\n");
}

function TypewriterMessage({ text }: { text: string }) {
  const [visibleText, setVisibleText] = useState("");

  const CHARS_PER_SECOND = 800;

  useEffect(() => {
    if (!text) return;

    let startTime: number | null = null;
    let raf: number;
    let cancelled = false;

    const animate = (timestamp: number) => {
      if (cancelled) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const chars = Math.min(
        Math.floor((elapsed / 1000) * CHARS_PER_SECOND),
        text.length,
      );
      setVisibleText(text.slice(0, chars));
      if (chars < text.length) {
        raf = requestAnimationFrame(animate);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [text]);

  if (!visibleText) return null;

  return <MessageResponse>{visibleText}</MessageResponse>;
}

const TOOL_LABELS: Record<string, string> = {
  // Existing labels
  recommend_places: "Searching for recommended places",
  plan_trip: "Planning your trip",
  estimate_budget: "Estimating budget",
  optimize_route: "Calculating route",
  find_events: "Searching for festivals & events",
  webSearch: "Searching the web",
  agent: "Processing",
  tools: "Running tools",

  // Core LangGraph Nodes
  intentRouter: "Analyzing request",
  tripPipeline: "Generating trip plan",
  hotelPipeline: "Processing hotel search",
  recommendPipeline: "Finding recommendations",
  routePipeline: "Planning route logistics",
  eventPipeline: "Processing event search",
  tripModifyPipeline: "Updating trip plan",
  budgetModifyPipeline: "Updating budget estimate",
  supervisorFallback: "Processing request",
  model_request: "AI generating response",
  trip_planner: "Planning itinerary",
  hotel_agent: "Finding hotels",
  route_agent: "Planning route",
  budget_agent: "Computing budget",

  // Backend Tools
  searchPlacesSemantic: "Searching for places",
  searchPlacesByKeyword: "Searching for places (Keywords)",
  searchEvents: "Searching for events & festivals",
  findNearbyPlaces: "Finding nearby places",
  calculateRoute: "Calculating travel distance",
  planRoute: "Optimizing itinerary route",
  generateItemizedBudget: "Generating budget breakdown",
  searchHotels: "Searching for hotels",
};

function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const label = TOOL_LABELS[toolCall.name] || toolCall.name;
  const toolState =
    toolCall.state === "running" ? "input-available" : "output-available";
  const progressText =
    typeof toolCall.progressMessage === "string" && toolCall.progressMessage
      ? toolCall.progressMessage
      : null;

  return (
    <Tool>
      <ToolHeader title={label} type="tool-invocation" state={toolState} />
      <ToolContent>
        {progressText ? (
          <div className="text-[11px] text-muted-foreground pb-1">
            {progressText}
          </div>
        ) : null}
        {toolCall.input && Object.keys(toolCall.input).length > 0 && (
          <ToolInput input={toolCall.input} toolName={toolCall.name} />
        )}
        {toolCall.state === "completed" && toolCall.output != null ? (
          <ToolOutput
            output={toolCall.output as Record<string, unknown>}
            errorText={undefined}
          />
        ) : null}
      </ToolContent>
    </Tool>
  );
}

export default function AIPlannerPage() {
  const router = useRouter();
  const createTripMutation = useCreateTrip();
  const addTripItemMutation = useAddTripDayItem();
  const setDayHotelMutation = useSetDayHotel();
  const { data: provinces } = useProvinces();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);

  const { data: activeConversation } = useChatConversation(
    activeConversationId || "",
  );
  const { data: messagesData } = useChatMessages(activeConversationId, {
    limit: 50,
  });

  const {
    messages,
    isStreaming,
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
    optimizeHotelAssignments,
  } = useAgentChat();

  const [trip, setTrip] = useState<PlannedTrip>({
    name: "",
    province: "",
    days: [],
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [text, setText] = useState("");
  const [activeMobilePanel, setActiveMobilePanel] = useState<
    "trip" | "map" | "chat"
  >("chat");
  const [focusedLocation, setFocusedLocation] = useState<{
    lat: number;
    lng: number;
    id?: string | number;
  } | null>(null);

  const hotelAssignmentsRef = useRef(hotelAssignments);
  hotelAssignmentsRef.current = hotelAssignments;

  const handleViewOnMap = (
    lat: number | string,
    lng: number | string,
    id?: string | number,
  ) => {
    const numLat = typeof lat === "string" ? parseFloat(lat) : lat;
    const numLng = typeof lng === "string" ? parseFloat(lng) : lng;
    if (!isNaN(numLat) && !isNaN(numLng)) {
      setFocusedLocation({ lat: numLat, lng: numLng, id });
      setActiveMobilePanel("map");
    } else {
      toast.error(
        "Location coordinates are currently unavailable for this place.",
      );
    }
  };

  useEffect(() => {
    if (messagesData?.data && messagesData.data.length > 0) {
      const loadedMessages = messagesData.data.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }));
      void loadConversation(
        loadedMessages,
        activeConversation?.threadId || null,
        activeConversationId || undefined,
      );
      setIsNewChat(false);
    } else if (!activeConversationId) {
      setIsNewChat(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesData, activeConversationId, activeConversation?.threadId]);

  useEffect(() => {
    if (activeConversation?.threadId && !isNewChat) {
      updateThreadId(activeConversation.threadId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation?.threadId, isNewChat]);

  useEffect(() => {
    if (tripData) {
      setTrip(tripData);
      const totalPlaces = tripData.days.reduce((s, d) => s + d.items.length, 0);
      toast.success(`Trip "${tripData.name}" updated: ${totalPlaces} places`);
    }
  }, [tripData]);

  const routePlannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hotelUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (routePlannerTimeoutRef.current) {
      clearTimeout(routePlannerTimeoutRef.current);
    }

    routePlannerTimeoutRef.current = setTimeout(() => {
      if (!tripData) return;

      let hotels: {
        hotel_id?: number;
        name: string;
        latitude: number;
        longitude: number;
        rating?: number;
        price_range?: string;
      }[] = [];

      if (hotelData?.hotels?.length) {
        hotels = hotelData.hotels.map((h) => ({
          hotel_id: h.id,
          name: h.name,
          latitude: h.latitude,
          longitude: h.longitude,
          rating: h.rating,
          price_range: h.priceRange,
        }));
      }

      if (hotels.length === 0 && routeData) {
        for (const day of routeData.itinerary) {
          for (const stop of day.route) {
            if (stop.type === "hotel" && stop.lat && stop.lng) {
              hotels.push({
                hotel_id: stop.hotel_id,
                name: stop.name,
                latitude: stop.lat,
                longitude: stop.lng,
              });
            }
          }
        }
      }

      if (hotels.length === 0) return;

      const days = tripData.days.map((d) => ({
        day: d.day,
        hotelCheckinTime: d.checkinTime || "14:00",
        hotelCheckoutTime: d.checkoutTime || "12:00",
        places: d.items
          .filter((i) => i.latitude && i.longitude)
          .map((i) => ({
            name: i.name,
            latitude: i.latitude!,
            longitude: i.longitude!,
            pg_place_id: i.pg_place_id,
            category: i.category,
            startTime: i.startTime,
            endTime: i.endTime,
          })),
      }));

      if (days.every((d) => d.places.length === 0)) return;

      fetch("/api/route-planner/plan", {
        method: "POST",
        headers: getClientAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          user_location: { latitude: 13.7563, longitude: 100.5018 },
          destination_province: tripData.province || "",
          num_days: tripData.days.length,
          days,
          shortlisted_hotels: hotels,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (data.planId) {
              setRoutePlanId(data.planId);
            }
            setRouteData(data);
          }
        })
        .catch((err) => console.warn("Route planner failed:", err));
    }, 500);

    return () => {
      if (routePlannerTimeoutRef.current) {
        clearTimeout(routePlannerTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripData, hotelData]);

  useEffect(() => {
    if (hotelUpdateTimeoutRef.current) {
      clearTimeout(hotelUpdateTimeoutRef.current);
    }

    hotelUpdateTimeoutRef.current = setTimeout(() => {
      const currentHotelAssignments = hotelAssignmentsRef.current;
      if (
        !routePlanId ||
        !currentHotelAssignments ||
        Object.keys(currentHotelAssignments).length === 0 ||
        !hotelData
      ) {
        return;
      }

      const hotelOverrides = Object.entries(currentHotelAssignments).map(
        ([night, hotelIdx]) => ({
          night: parseInt(night),
          hotel_name: hotelData!.hotels[hotelIdx].name,
          latitude: hotelData!.hotels[hotelIdx].latitude,
          longitude: hotelData!.hotels[hotelIdx].longitude,
          hotel_id: hotelData!.hotels[hotelIdx].id,
        }),
      );

      fetch(`/api/route-planner/plan/${routePlanId}/hotels`, {
        method: "PATCH",
        headers: getClientAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({
          hotel_overrides: hotelOverrides,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setRouteData(data);
          }
        })
        .catch((err) => console.warn("Hotel update failed:", err));
    }, 300);

    return () => {
      if (hotelUpdateTimeoutRef.current) {
        clearTimeout(hotelUpdateTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelAssignments, routePlanId, hotelData]);

  useEffect(() => {
    if (routePlanId && !routeData) {
      fetchRoutePlanById(routePlanId).then((data) => {
        if (data) {
          setRouteData(data);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePlanId, routeData]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  const handleConfirmTrip = async () => {
    if (!trip.name || trip.days.length === 0) return;

    setIsConfirming(true);
    try {
      let provinceId =
        provinces && provinces.length > 0 ? provinces[0].id : 230;
      if (trip.province && provinces) {
        const tripProvRaw = trip.province as string;
        const searchStr = tripProvRaw.trim().toLowerCase();
        const foundProvince = provinces.find(
          (p) =>
            p.name_en?.trim().toLowerCase() === searchStr ||
            p.name?.trim() === tripProvRaw.trim() ||
            searchStr.includes(p.name_en?.trim().toLowerCase() || "") ||
            tripProvRaw.trim().includes(p.name?.trim() || ""),
        );
        if (foundProvince) provinceId = foundProvince.id;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = addDays(startDate, trip.days.length || 1);

      const newTrip = await createTripMutation.mutateAsync({
        name: trip.name || "My Ai Trip",
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        province_ids: [provinceId],
        status: "draft",
        budget: budgetData,
      });

      const tripId = newTrip.id;

      for (const day of trip.days) {
        for (const item of day.items) {
          try {
            if (item.type === "event" && item.event_id) {
              await addTripItemMutation.mutateAsync({
                tripId,
                dayNumber: day.day,
                item: {
                  item_type: "event",
                  item_id: item.event_id,
                  start_time: item.startTime || "09:00",
                  end_time: item.endTime || "10:00",
                  note: item.name,
                },
              });
            } else if (
              item.type === "place" &&
              (item.pg_place_id || item.raw_id)
            ) {
              const placeId = item.pg_place_id || item.raw_id;
              await addTripItemMutation.mutateAsync({
                tripId,
                dayNumber: day.day,
                item: {
                  item_type: "place",
                  item_id: placeId!,
                  start_time: item.startTime || "09:00",
                  end_time: item.endTime || "10:00",
                  note: item.name,
                },
              });
            } else {
              console.warn(
                `Skipping item "${item.name}": missing id (type=${item.type})`,
              );
            }
          } catch (e) {
            console.error("Failed to add item", e);
          }
        }
      }

      const numNights = trip.days.length - 1;
      let hasHotelsSaved = false;

      if (
        Object.keys(hotelAssignments).length > 0 &&
        hotelData?.hotels?.length
      ) {
        for (let night = 1; night <= numNights; night++) {
          const hotelIdx = hotelAssignments[night];
          if (hotelIdx === undefined || hotelIdx === null) continue;
          const hotel = hotelData.hotels[hotelIdx];
          if (!hotel?.id) continue;

          const plannedDay = tripData?.days?.find((d) => d.day === night);
          const checkinTime = plannedDay?.checkinTime || "14:00";
          const checkoutTime = plannedDay?.checkoutTime || "12:00";

          try {
            await setDayHotelMutation.mutateAsync({
              tripId,
              dayNumber: night,
              data: {
                hotelId: hotel.id,
                checkinTime,
                checkoutTime,
              },
            });
            hasHotelsSaved = true;
          } catch (e) {
            console.error(`Failed to set hotel for day ${night}`, e);
          }
        }
      } else if (routeData?.itinerary && routeData.itinerary.length > 0) {
        for (const dayItinerary of routeData.itinerary) {
          const hotelStop = dayItinerary.route?.find(
            (stop) => stop.type === "hotel" && stop.hotel_id,
          );

          if (hotelStop && hotelStop.hotel_id) {
            const plannedDay = tripData?.days?.find(
              (d) => d.day === dayItinerary.day,
            );
            const checkinTime = plannedDay?.checkinTime || "14:00";
            const checkoutTime = plannedDay?.checkoutTime || "12:00";

            try {
              await setDayHotelMutation.mutateAsync({
                tripId,
                dayNumber: dayItinerary.day,
                data: {
                  hotelId: hotelStop.hotel_id,
                  checkinTime,
                  checkoutTime,
                },
              });
              hasHotelsSaved = true;
            } catch (e) {
              console.error(
                `Failed to set hotel for day ${dayItinerary.day}`,
                e,
              );
            }
          }
        }
      }

      if (numNights <= 0 && !hasHotelsSaved) {
        toast.info("Day trip created! No overnight stay needed.");
      }

      toast.success(`Trip "${trip.name}" created!`);
      router.push(`/my-trip/${tripId}`);
      router.push(`/my-trip/${tripId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create trip.");
    } finally {
      setIsConfirming(false);
    }
  };

  const tripMapItems: {
    id: string;
    name: string;
    type?: string;
    category?: string;
    latitude: number;
    longitude: number;
    rating?: number;
    thumbnail_url?: string;
    event_id?: number;
    pg_place_id?: number;
    raw_id?: number;
    itemType?: "place" | "event" | "hotel";
  }[] = trip.days.flatMap((d) =>
    d.items
      .filter(
        (i): i is typeof i & { latitude: number; longitude: number } =>
          i.latitude !== undefined && i.longitude !== undefined,
      )
      .map((i, idx) => ({
        id: i.id || `place-${d.day}-${idx}-${i.name}`,
        name: i.name,
        type: i.type,
        category: i.category,
        latitude: i.latitude,
        longitude: i.longitude,
        rating: i.rating,
        thumbnail_url: i.thumbnail_url,
        event_id: i.event_id,
        pg_place_id: i.pg_place_id,
        raw_id: i.raw_id,
        itemType: i.type as "place" | "event",
      })),
  );

  const hotelMapItems: {
    id: string;
    name: string;
    category?: string;
    latitude: number;
    longitude: number;
    rating?: number;
    thumbnail_url?: string;
    priceRange?: string;
    bookingUrl?: string;
    address?: string;
    itemType: "hotel";
  }[] =
    hotelData?.hotels?.map((h, idx) => ({
      id: `hotel-${idx}-${h.name}`,
      name: h.name,
      category: "hotel",
      latitude: h.latitude,
      longitude: h.longitude,
      rating: h.rating,
      thumbnail_url: h.thumbnail,
      priceRange: h.priceRange,
      bookingUrl: h.bookingUrl,
      address: h.address,
      itemType: "hotel" as const,
    })) || [];

  const mapItems = [...tripMapItems, ...hotelMapItems];

  const routeGeometries =
    routeData?.itinerary
      ?.filter((day) => day.geometry?.coordinates?.length)
      .map((day) => ({
        day: day.day,
        coordinates: day.geometry!.coordinates,
      })) || [];

  const uniqueDays = [...new Set(routeGeometries.map((r) => r.day))].sort(
    (a, b) => a - b,
  );

  const ChatPanelContent = () => (
    <>
      <div className="px-4 py-3.5 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">TaluiThai AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">
                Plan Trip
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
            title="Chat History"
          >
            <History className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        {activeConversation && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 truncate">
                {activeConversation.title || "New Chat"}
              </p>
            </div>
            <button
              onClick={() => {
                setActiveConversationId(null);
                reset();
              }}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              New Chat
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-2 sm:px-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Welcome to TaluiThai AI
            </p>
            <p className="text-xs text-gray-500">
              Tell me where you want to go and how many days — I&apos;ll help
              plan your trip!
            </p>
          </div>
        ) : (
          messages
            .filter((msg) => {
              if (msg.role !== "assistant") return true;
              const isCurrentlyStreamingMsg =
                isStreaming && msg === messages[messages.length - 1];
              if (isCurrentlyStreamingMsg) return true;
              const cleaned = msg.content ? stripJsonBlocks(msg.content) : "";
              return (
                cleaned.trim().length > 0 ||
                (msg.toolCalls && msg.toolCalls.length > 0)
              );
            })
            .map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse items-end" : "items-end"}`}
              >
                {msg.role === "user" ? (
                  <>
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-200 mb-1">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="max-w-[85%] relative">
                      <div
                        className="rounded-2xl rounded-br-sm px-3 sm:px-3.5 py-2.5 text-white shadow-md shadow-emerald-200/50"
                        style={{
                          background:
                            "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                        }}
                      >
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shrink-0 shadow-md shadow-emerald-200 mb-1">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 max-w-[calc(100%-2rem)]">
                      <div className="bg-gray-50 text-gray-700 border border-gray-100 rounded-2xl rounded-bl-sm px-3 sm:px-3.5 py-2.5 shadow-sm text-xs leading-relaxed">
                        {(() => {
                          const isCurrentlyStreaming =
                            isStreaming &&
                            msg === messages[messages.length - 1];
                          const cleanText = msg.content
                            ? stripJsonBlocks(msg.content)
                            : "";
                          return (
                            <div className="space-y-2">
                              {msg.toolCalls && msg.toolCalls.length > 0 && (
                                <div className="space-y-2">
                                  {msg.toolCalls.map((tc: ToolCall) => (
                                    <ToolCallDisplay
                                      key={tc.id}
                                      toolCall={tc}
                                    />
                                  ))}
                                </div>
                              )}

                              {isCurrentlyStreaming ? (
                                !cleanText && !msg.toolCalls?.length ? (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader size={14} />
                                    <span className="text-xs">Thinking...</span>
                                  </div>
                                ) : msg.toolCalls?.length ? (
                                  <div className="flex items-center gap-2 text-muted-foreground mt-2">
                                    <Loader size={14} />
                                    <span className="text-xs">
                                      Processing...
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader size={14} />
                                    <span className="text-xs">
                                      Writing response...
                                    </span>
                                  </div>
                                )
                              ) : (
                                (() => {
                                  const sanitized = cleanText
                                    ? sanitizeMarkdownTables(cleanText)
                                    : "";
                                  const isLatest =
                                    msg === messages[messages.length - 1];
                                  return (
                                    <>
                                      {sanitized ? (
                                        isLatest ? (
                                          <div className="whitespace-pre-wrap">
                                            <TypewriterMessage
                                              text={sanitized}
                                            />
                                          </div>
                                        ) : (
                                          <div className="whitespace-pre-wrap">
                                            <MessageResponse>
                                              {sanitized}
                                            </MessageResponse>
                                          </div>
                                        )
                                      ) : null}
                                      {trip.days.length > 0 && isLatest && (
                                        <TripDayCards
                                          days={trip.days}
                                          onViewOnMap={handleViewOnMap}
                                        />
                                      )}
                                    </>
                                  );
                                })()
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
        )}
        <div className="h-4" />
      </div>

      {messages.length === 0 && (
        <div className="px-3 sm:px-4 pb-3">
          <p className="text-xs text-gray-400 mb-2">Quick start:</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              {
                text: "3 days Krabi",
                prompt: "Plan a 3-day trip to Krabi for beach lovers",
              },
              {
                text: "Temple Tour",
                prompt: "Plan a 2-day cultural temple tour in Chiang Mai",
              },
              {
                text: "Nature Hiking",
                prompt: "Plan a nature and hiking trip in Northern Thailand",
              },
              {
                text: "Family Trip",
                prompt: "Plan a 4-day family trip to Phuket",
              },
            ].map((qp) => (
              <button
                key={qp.text}
                onClick={() => sendMessage(qp.prompt)}
                className="flex items-center justify-center px-2 py-2 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-100 hover:border-emerald-200 rounded-xl text-[11px] text-gray-600 transition-all text-center"
              >
                {qp.text}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-3 sm:px-4 py-3 border-t border-gray-100 bg-white shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Plan a trip..."
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-gray-700 placeholder-gray-400"
          />
          {isStreaming ? (
            <button
              onClick={stop}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 transition-all shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" ry="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => handleSubmit()}
              disabled={!text.trim()}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${text.trim() ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f8f9fa] h-screen">
      {/* Desktop: Resizable Panels */}
      <div className="hidden lg:flex flex-1 h-full w-full">
        <Group
          id="desktop-planner-group"
          orientation="horizontal"
          className="w-full h-full"
        >
          {/* Trip Result Panel (left) */}
          <Panel defaultSize="20%" minSize="15%" maxSize="35%">
            <div className="h-full bg-white border-r border-gray-100 shadow-sm">
              <TripResultPanel
                tripName={trip.name}
                days={trip.days}
                budget={trip.budget}
                budgetData={budgetData}
                hotelData={hotelData}
                routeData={routeData}
                selectedHotelIndexes={selectedHotelIndexes}
                onSelectHotel={onSelectHotel}
                hotelAssignments={hotelAssignments}
                onAssignHotel={onAssignHotel}
                onOptimizeHotels={optimizeHotelAssignments}
                onConfirm={handleConfirmTrip}
                isConfirming={isConfirming}
                onViewOnMap={handleViewOnMap}
              />
            </div>
          </Panel>

          <Separator className="w-1.5 bg-gray-100 hover:bg-emerald-400 focus:bg-emerald-400 transition-colors cursor-col-resize flex flex-col justify-center items-center group relative z-10">
            <div className="z-20 flex h-6 w-3 items-center justify-center rounded-sm border border-gray-200 bg-white shadow-sm group-hover:border-emerald-500">
              <GripVertical className="h-2.5 w-2.5 text-gray-400 group-hover:text-emerald-500" />
            </div>
          </Separator>

          {/* Center Map Area */}
          <Panel>
            <div className="h-full relative overflow-hidden bg-muted/10">
              <div className="absolute inset-0">
                <BackgroundMap
                  items={mapItems}
                  routeGeometries={routeGeometries}
                  focusedLocation={focusedLocation}
                />
              </div>
              <RouteLegend days={uniqueDays} />
            </div>
          </Panel>

          <Separator className="w-1.5 bg-gray-100 hover:bg-emerald-400 focus:bg-emerald-400 transition-colors cursor-col-resize flex flex-col justify-center items-center group relative z-10">
            <div className="z-20 flex h-6 w-3 items-center justify-center rounded-sm border border-gray-200 bg-white shadow-sm group-hover:border-emerald-500">
              <GripVertical className="h-2.5 w-2.5 text-gray-400 group-hover:text-emerald-500" />
            </div>
          </Separator>

          {/* Chat Panel (right) */}
          <Panel defaultSize="25%" minSize="20%" maxSize="40%">
            <div className="h-full flex flex-col bg-white border-l border-gray-100 shadow-sm overflow-hidden">
              <ChatPanelContent />
            </div>
          </Panel>
        </Group>
      </div>

      {/* Mobile: Full-screen panels with bottom navigation */}
      <div className="lg:hidden flex-1 flex flex-col">
        {activeMobilePanel === "trip" && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 text-sm">Trip Plan</h3>
              <button
                onClick={() => setActiveMobilePanel("map")}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TripResultPanel
                tripName={trip.name}
                days={trip.days}
                budget={trip.budget}
                budgetData={budgetData}
                hotelData={hotelData}
                routeData={routeData}
                selectedHotelIndexes={selectedHotelIndexes}
                onSelectHotel={onSelectHotel}
                hotelAssignments={hotelAssignments}
                onAssignHotel={onAssignHotel}
                onOptimizeHotels={optimizeHotelAssignments}
                onConfirm={handleConfirmTrip}
                isConfirming={isConfirming}
                onViewOnMap={handleViewOnMap}
              />
            </div>
          </div>
        )}

        {activeMobilePanel === "map" && (
          <div className="flex-1 relative overflow-hidden bg-muted/10">
            <div className="absolute inset-0">
              <BackgroundMap
                items={mapItems}
                routeGeometries={routeGeometries}
                focusedLocation={focusedLocation}
              />
            </div>
            <RouteLegend days={uniqueDays} />
          </div>
        )}

        {activeMobilePanel === "chat" && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <ChatPanelContent />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around gap-2 safe-area-inset-bottom">
        <button
          onClick={() => setActiveMobilePanel("trip")}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
            activeMobilePanel === "trip"
              ? "text-emerald-600 bg-emerald-50"
              : "text-gray-500"
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span className="text-[10px] font-medium">Trip</span>
        </button>
        <button
          onClick={() => setActiveMobilePanel("map")}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
            activeMobilePanel === "map"
              ? "text-emerald-600 bg-emerald-50"
              : "text-gray-500"
          }`}
        >
          <Map className="w-5 h-5" />
          <span className="text-[10px] font-medium">Map</span>
        </button>
        <button
          onClick={() => setActiveMobilePanel("chat")}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
            activeMobilePanel === "chat"
              ? "text-emerald-600 bg-emerald-50"
              : "text-gray-500"
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] font-medium">AI Chat</span>
        </button>
      </div>

      {/* Chat History Sidebar */}
      <ChatHistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        activeConversationId={activeConversationId}
        onSelectConversation={async (id) => {
          setActiveConversationId(id);
          setIsHistoryOpen(false);
        }}
        onNewConversation={async () => {
          reset();
          setActiveConversationId(null);
          setIsHistoryOpen(false);
        }}
      />
    </div>
  );
}
