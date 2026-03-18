"use client";

import { useState, useEffect } from "react";
import { BackgroundMap } from "@/components/ai-planner/background-map";
import { TripResultPanel } from "@/components/ai-planner/trip-result-panel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateTrip, useAddTripDayItem } from "@/hooks/api/useTrips";
import { useProvinces } from "@/hooks/api/useProvinces";
import { addDays, format } from "date-fns";
import { MapPin, Bot, Sparkles } from "lucide-react";
import { eventService } from "@/lib/services/event";

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
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  type PromptInputMessage,
} from "@/components/ai/prompt-input";
import { Suggestions, Suggestion } from "@/components/ai/suggestion";
import { Loader } from "@/components/ai/loader";

/** Strip JSON code blocks from displayed message (trip data already extracted) */
function stripJsonBlocks(text: string): string {
  return text.replace(/```(?:json)?\s*\n[\s\S]*?```/g, "").trim();
}

/**
 * Sanitize broken markdown tables.
 * The LLM sometimes:
 * 1) Mixes event descriptions into budget table cells
 * 2) Concatenates multiple rows on one line (| A | B || C | D |)
 * 3) Injects text mid-row (| cost | 500 | 1000festival text... |)
 * This function aggressively cleans tables to ensure they render properly.
 */
function sanitizeMarkdownTables(text: string): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Detect start of a table block
    if (line.trimStart().startsWith("|")) {
      const rawBlock: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("|")) {
        rawBlock.push(lines[i]);
        i++;
      }

      // Step 1: Split concatenated rows (e.g. "| A | B || C | D |" → two rows)
      const expanded: string[] = [];
      for (const row of rawBlock) {
        // Split on || which indicates concatenated rows
        const parts = row.split(/\|\|/);
        if (parts.length > 1) {
          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed) continue;
            // Re-add leading/trailing pipes
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

      // Step 2: Filter valid rows (start+end with |, have 3+ pipe segments)
      const validRows = expanded.filter((row) => {
        const t = row.trim();
        return t.startsWith("|") && t.endsWith("|") && t.split("|").length >= 3;
      });

      if (validRows.length < 2) {
        result.push(...rawBlock);
        continue;
      }

      // Step 3: Determine column count from header
      const headerCols = validRows[0].split("|").length;

      // Step 4: Clean each row — remove injected text from cells
      const cleanedRows: string[] = [];
      for (const row of validRows) {
        const cells = row.split("|").map((c) => c.trim());
        // Skip if column count doesn't match header
        if (cells.length !== headerCols) continue;

        // Clean each cell: if a cell looks like "1000กระทงสุโขทัย จัดขึ้น..."
        // extract just the number part
        const cleanCells = cells.map((cell, idx) => {
          if (idx === 0 || idx === cells.length - 1) return cell; // empty edge cells
          // If cell contains a number followed by Thai/non-numeric text, keep only the number
          const numMatch = cell.match(/^(\d[\d,.]*)(?:[ก-๙a-zA-Z])/);
          if (numMatch) return numMatch[1];
          // If cell is too long (>40 chars) and not the separator, it has injected text
          if (cell.length > 40 && !/^[-:\s]+$/.test(cell)) {
            // Try to extract just the first meaningful part (before any date/event text)
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

      // Step 5: Ensure separator row exists
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

/** Component that reveals text progressively after stream completes */
function TypewriterMessage({ text }: { text: string }) {
  const [visibleText, setVisibleText] = useState("");

  // Characters per second
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

const SUGGESTIONS = [
  "Plan a 3-day Chiang Mai trip focusing on temples and nature",
  "Recommend places in Phuket for families",
  "2-day Krabi trip with a 5,000 THB budget",
  "Explore Chiang Rai — cafes and scenic views",
];

// Map our ToolCall state to shadcn Tool component
const TOOL_LABELS: Record<string, string> = {
  // Sub-agent tools (high-level)
  recommend_places: "Searching for recommended places",
  plan_trip: "Planning your trip",
  estimate_budget: "Estimating budget",
  optimize_route: "Calculating route",
  find_events: "Searching for festivals & events",
  webSearch: "Searching the web",
  // Graph nodes
  agent: "Processing",
  tools: "Running tools",
};

function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
  const label = TOOL_LABELS[toolCall.name] || toolCall.name;
  const toolState =
    toolCall.state === "running" ? "input-available" : "output-available";

  return (
    <Tool>
      <ToolHeader title={label} type="tool-invocation" state={toolState} />
      <ToolContent>
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
  const { data: provinces } = useProvinces();

  const { messages, isStreaming, tripData, budgetData, sendMessage, stop } =
    useAgentChat();

  const [trip, setTrip] = useState<PlannedTrip>({
    name: "",
    province: "",
    days: [],
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const [text, setText] = useState("");

  // Sync trip data from agent response
  useEffect(() => {
    if (tripData) {
      setTrip(tripData);
      const totalPlaces = tripData.days.reduce((s, d) => s + d.items.length, 0);
      toast.success(`Trip "${tripData.name}" updated: ${totalPlaces} places`);
    }
  }, [tripData]);

  const handleSubmit = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleConfirmTrip = async () => {
    if (!trip.name || trip.days.length === 0) return;

    setIsConfirming(true);
    try {
      let provinceId =
        provinces && provinces.length > 0 ? provinces[0].id : 230; // 230 is Prachin Buri as fallback if provinces didn't load
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
              // Add event item
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
              // Add place item
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

      // Auto-add upcoming events for the destination province
      try {
        const upcomingEvents = await eventService.getUpcomingByProvinces(
          [provinceId],
          format(startDate, "yyyy-MM-dd"),
          format(endDate, "yyyy-MM-dd"),
        );

        let eventsAdded = 0;
        for (const event of upcomingEvents) {
          // Find which day the event falls on
          const eventStartDate = new Date(event.start_date);
          const eventDay =
            Math.ceil(
              (eventStartDate.getTime() - startDate.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1;

          // Only add if event falls within trip days
          if (eventDay >= 1 && eventDay <= trip.days.length) {
            try {
              await addTripItemMutation.mutateAsync({
                tripId,
                dayNumber: eventDay,
                item: {
                  item_type: "event",
                  item_id: event.id,
                  start_time: "09:00",
                  end_time: "10:00",
                  note: event.name,
                },
              });
              eventsAdded++;
            } catch (e) {
              // Event might already be added
              console.warn(`Could not add event ${event.id}:`, e);
            }
          }
        }

        if (eventsAdded > 0) {
          toast.info(`Added ${eventsAdded} upcoming event(s) to your trip!`);
        }
      } catch (e) {
        console.warn("Failed to fetch upcoming events:", e);
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

  // Flatten items for map display
  const mapItems = trip.days.flatMap((d) =>
    d.items.map((i) => ({
      ...i,
      id: i.id || Math.random().toString(36).substr(2, 9),
    })),
  );

  const chatStatus = isStreaming ? "streaming" : "ready";

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f8f9fa] h-screen">
      {/* Trip Result Panel (left) */}
      <div className="relative z-10 shrink-0 h-full flex flex-col bg-white border-r border-gray-100 shadow-sm w-[320px]">
        <TripResultPanel
          tripName={trip.name}
          days={trip.days}
          budget={trip.budget}
          budgetData={budgetData}
          onConfirm={handleConfirmTrip}
          isConfirming={isConfirming}
        />
      </div>

      {/* Center Area (Map) */}
      <div className="flex-1 relative overflow-hidden bg-muted/10">
        <div className="absolute inset-0">
          <BackgroundMap items={mapItems} />
        </div>
      </div>

      {/* Chat Panel (right) */}
      <div className="w-[400px] flex flex-col bg-white border-l border-gray-100 shadow-sm shrink-0 relative overflow-hidden z-10">
        {/* Chat Header */}
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
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Welcome to TaluiThai AI
              </p>
              <p className="text-xs text-gray-500">
                Tell me where you want to go and how many days — I'll help plan
                your trip!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
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
                        className="rounded-2xl rounded-br-sm px-3.5 py-2.5 text-white shadow-md shadow-emerald-200/50"
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
                      <div className="bg-gray-50 text-gray-700 border border-gray-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm text-xs leading-relaxed">
                        {(() => {
                          const isCurrentlyStreaming =
                            isStreaming &&
                            msg === messages[messages.length - 1];
                          const cleanText = msg.content
                            ? stripJsonBlocks(msg.content)
                            : "";
                          return (
                            <div className="space-y-2">
                              {/* Tool calls */}
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
                                /* Done streaming */
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
                                        <TripDayCards days={trip.days} />
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
          {/* Add spacer at bottom for scrolling */}
          <div className="h-4" />
        </div>

        {/* Quick Prompts (only shown initially) */}
        {messages.length === 0 && (
          <div className="px-4 pb-3">
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

        {/* Input Area */}
        <div className="px-4 py-3 border-t border-gray-100 bg-white">
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
              className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
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
      </div>
    </div>
  );
}
