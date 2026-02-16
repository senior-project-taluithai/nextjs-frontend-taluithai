"use client";

import { useState, useEffect } from "react";
import { BackgroundMap } from "@/components/ai-planner/background-map";
import { TripResultPanel } from "@/components/ai-planner/trip-result-panel";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateTrip, useAddTripDayItem } from "@/hooks/api/useTrips";
import { useProvinces } from "@/hooks/api/useProvinces";
import { addDays, format } from "date-fns";
import { MapPin } from "lucide-react";

import { useAgentChat, type PlannedTrip, type ToolCall } from "@/hooks/useAgentChat";
import { TripDayCards } from "@/components/ai-planner/trip-day-cards";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai/tool";
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from "@/components/ai/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai/message";
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
                        const fixed = (trimmed.startsWith("|") ? "" : "| ") + trimmed + (trimmed.endsWith("|") ? "" : " |");
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
                        const shortMatch = cell.match(/^(.{1,30}?)(?:\d\.\s|จัดขึ้น|เทศกาล|งาน|festival)/i);
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
                const sepRow = "| " + Array(headerCols - 2).fill("---").join(" | ") + " |";
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
                text.length
            );
            setVisibleText(text.slice(0, chars));
            if (chars < text.length) {
                raf = requestAnimationFrame(animate);
            }
        };

        raf = requestAnimationFrame(animate);
        return () => { cancelled = true; cancelAnimationFrame(raf); };
    }, [text]);

    if (!visibleText) return null;

    return <MessageResponse>{visibleText}</MessageResponse>;
}

const SUGGESTIONS = [
    "วางแผนทริปเชียงใหม่ 3 วัน เน้นวัดและธรรมชาติ",
    "แนะนำที่เที่ยวภูเก็ต สำหรับครอบครัว",
    "ทริปกระบี่ 2 วัน งบ 5000 บาท",
    "เที่ยวเชียงราย เน้นคาเฟ่และวิวสวยๆ",
];

// Map our ToolCall state to shadcn Tool component
const TOOL_LABELS: Record<string, string> = {
    // Sub-agent tools (high-level)
    recommend_places: "กำลังค้นหาสถานที่แนะนำ",
    plan_trip: "กำลังวางแผนทริป",
    estimate_budget: "กำลังคำนวณงบประมาณ",
    optimize_route: "กำลังคำนวณเส้นทาง",
    find_events: "กำลังค้นหาเทศกาล/กิจกรรม",
    webSearch: "กำลังค้นหาข้อมูลจากเว็บ",
    // Graph nodes
    agent: "กำลังประมวลผล",
    tools: "กำลังเรียกใช้เครื่องมือ",
};

function ToolCallDisplay({ toolCall }: { toolCall: ToolCall }) {
    const label = TOOL_LABELS[toolCall.name] || toolCall.name;
    const toolState = toolCall.state === "running" ? "input-available" : "output-available";

    return (
        <Tool>
            <ToolHeader
                title={label}
                type="tool-invocation"
                state={toolState}
            />
            <ToolContent>
                {toolCall.input && Object.keys(toolCall.input).length > 0 && (
                    <ToolInput input={toolCall.input} />
                )}
                {toolCall.state === "completed" && toolCall.output != null ? (
                    <ToolOutput output={toolCall.output as Record<string, unknown>} errorText={undefined} />
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

    const { messages, isStreaming, tripData, sendMessage, stop } = useAgentChat();

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

    const handleSubmit = (message: PromptInputMessage) => {
        if (!message.text.trim()) return;
        sendMessage(message.text);
        setText("");
    };

    const handleSuggestionClick = (suggestion: string) => {
        sendMessage(suggestion);
    };

    const handleConfirmTrip = async () => {
        if (!trip.name || trip.days.length === 0) return;

        setIsConfirming(true);
        try {
            let provinceId = 1;
            if (trip.province && provinces) {
                const foundProvince = provinces.find(
                    (p) =>
                        p.name_en?.toLowerCase() === trip.province?.toLowerCase() ||
                        p.name === trip.province,
                );
                if (foundProvince) provinceId = foundProvince.id;
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1);
            const endDate = addDays(startDate, trip.days.length);

            const newTrip = await createTripMutation.mutateAsync({
                name: trip.name,
                start_date: format(startDate, "yyyy-MM-dd"),
                end_date: format(endDate, "yyyy-MM-dd"),
                province_ids: [provinceId],
                status: "draft",
            });

            const tripId = newTrip.id;

            for (const day of trip.days) {
                for (const item of day.items) {
                    try {
                        const placeId = item.pg_place_id || item.raw_id;
                        if (!placeId) {
                            console.warn(`Skipping item "${item.name}": no pg_place_id`);
                            continue;
                        }
                        await addTripItemMutation.mutateAsync({
                            tripId,
                            dayNumber: day.day,
                            item: {
                                item_type: "place",
                                item_id: placeId,
                                start_time: item.startTime || "09:00",
                                end_time: item.endTime || "10:00",
                                note: item.name,
                            },
                        });
                    } catch (e) {
                        console.error("Failed to add item", e);
                    }
                }
            }

            toast.success(`Trip "${trip.name}" created!`);
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
        <div className="relative w-full h-screen overflow-hidden flex">
            {/* Background Map */}
            <BackgroundMap items={mapItems} />

            {/* Trip Result Panel (left) */}
            <div className="relative z-10 h-full shrink-0">
                <TripResultPanel
                    tripName={trip.name}
                    days={trip.days}
                    budget={trip.budget}
                    onConfirm={handleConfirmTrip}
                    isConfirming={isConfirming}
                />
            </div>

            {/* Spacer — lets map show between panels */}
            <div className="flex-1 min-w-0" />

            {/* Chat Panel (right) */}
            <div className="relative z-10 shrink-0 flex h-full w-[400px] flex-col border-l bg-background/95 backdrop-blur-sm shadow-lg">
                {/* Header */}
                <div className="flex items-center gap-2 border-b px-4 py-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">TaluiThai AI</h2>
                </div>

                {/* Conversation */}
                <Conversation className="min-h-0 flex-1">
                    <ConversationContent>
                        {messages.length === 0 ? (
                            <ConversationEmptyState
                                title="TaluiThai AI"
                                description="บอกได้เลยว่าอยากไปเที่ยวที่ไหน กี่วัน งบเท่าไหร่ แล้วผมจะช่วยวางแผนให้ครับ!"
                                icon={<MapPin className="h-8 w-8" />}
                            />
                        ) : (
                            messages.map((msg) => (
                                <Message key={msg.id} from={msg.role}>
                                    <MessageContent>
                                        {msg.role === "assistant" ? (() => {
                                            const isCurrentlyStreaming = isStreaming && msg === messages[messages.length - 1];
                                            const cleanText = msg.content ? stripJsonBlocks(msg.content) : "";
                                            return (
                                                <>
                                                    {/* Tool calls — always show progress */}
                                                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                                                        <div className="space-y-2">
                                                            {msg.toolCalls.map((tc: ToolCall) => (
                                                                <ToolCallDisplay key={tc.id} toolCall={tc} />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {isCurrentlyStreaming ? (
                                                        /* While streaming: show thinking indicator, hide raw text */
                                                        !cleanText && !msg.toolCalls?.length ? (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Loader size={16} />
                                                                <span className="text-sm">กำลังคิด...</span>
                                                            </div>
                                                        ) : msg.toolCalls?.length ? (
                                                            <div className="flex items-center gap-2 text-muted-foreground mt-2">
                                                                <Loader size={16} />
                                                                <span className="text-sm">กำลังสรุปข้อมูล...</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                                <Loader size={16} />
                                                                <span className="text-sm">กำลังเขียนคำตอบ...</span>
                                                            </div>
                                                        )
                                                    ) : (
                                                        /* Stream complete: render formatted response */
                                                        (() => {
                                                            const sanitized = cleanText ? sanitizeMarkdownTables(cleanText) : "";
                                                            const isLatest = msg === messages[messages.length - 1];
                                                            return (
                                                                <>
                                                                    {sanitized ? (
                                                                        isLatest ? (
                                                                            <TypewriterMessage text={sanitized} />
                                                                        ) : (
                                                                            <MessageResponse>{sanitized}</MessageResponse>
                                                                        )
                                                                    ) : null}
                                                                    {/* Day cards with horizontal scroll */}
                                                                    {trip.days.length > 0 && isLatest && (
                                                                        <TripDayCards days={trip.days} />
                                                                    )}
                                                                </>
                                                            );
                                                        })()
                                                    )}
                                                </>
                                            );
                                        })() : (
                                            <p>{msg.content}</p>
                                        )}
                                    </MessageContent>
                                </Message>
                            ))
                        )}
                    </ConversationContent>
                    <ConversationScrollButton />
                </Conversation>

                {/* Suggestions + Input */}
                <div className="shrink-0 space-y-3 border-t p-3">
                    {messages.length === 0 && (
                        <Suggestions>
                            {SUGGESTIONS.map((s) => (
                                <Suggestion
                                    key={s}
                                    suggestion={s}
                                    onClick={handleSuggestionClick}
                                />
                            ))}
                        </Suggestions>
                    )}

                    <PromptInput onSubmit={handleSubmit}>
                        <PromptInputBody>
                            <PromptInputTextarea
                                placeholder="พิมพ์ข้อความ..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </PromptInputBody>
                        <PromptInputFooter>
                            <div />
                            <PromptInputSubmit
                                disabled={!text.trim() && !isStreaming}
                                status={chatStatus}
                                onClick={isStreaming ? stop : undefined}
                            />
                        </PromptInputFooter>
                    </PromptInput>
                </div>
            </div>
        </div>
    );
}
