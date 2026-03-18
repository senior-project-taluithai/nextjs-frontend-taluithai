"use client";

import { useState } from "react";
import { Clock, Star, MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { BudgetPanel } from "@/components/ai-planner/budget-panel";
import type { BudgetData } from "@/hooks/useAgentChat";

interface TripItem {
    id?: string;
    name: string;
    type: string;
    startTime?: string;
    endTime?: string;
    rating?: number;
    category?: string;
    thumbnail_url?: string;
}

interface TripDay {
    day: number;
    items: TripItem[];
}

interface BudgetBreakdown {
    total?: number;
    accommodation?: number;
    food?: number;
    transport?: number;
    activities?: number;
}

interface TripResultPanelProps {
    tripName: string;
    days: TripDay[];
    budget?: BudgetBreakdown;
    budgetData?: BudgetData | null;
    onConfirm: () => void;
    isConfirming: boolean;
}

export function TripResultPanel({ tripName, days, budget: _budget, budgetData, onConfirm, isConfirming }: TripResultPanelProps) {
    const totalPlaces = days.reduce((sum, d) => sum + d.items.length, 0);
    // Initialize expanded days array with all days initially expanded
    const [expandedDays, setExpandedDays] = useState<number[]>(days.map(d => d.day));
    const [activeView, setActiveView] = useState<"itinerary" | "budget">("itinerary");

    // Update expandedDays if days prop changes and new days are added
    // This simple approach just ensures newly planned days are visible
    // A more robust approach might be needed if days change dramatically, 
    // but typically it's appended sequentially.

    const toggleDay = (day: number) => {
        setExpandedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white w-full pointer-events-auto">
            {/* Trip Info Header */}
            {days.length > 0 && (
                <div className="px-4 py-3 border-b border-gray-100 bg-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{tripName || "New Trip"}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{days.length} days</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{totalPlaces} places</span>
                            </div>
                        </div>
                    </div>
                    {budgetData && (
                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-1">
                            <button
                                onClick={() => setActiveView("itinerary")}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    activeView === "itinerary"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Itinerary
                            </button>
                            <button
                                onClick={() => setActiveView("budget")}
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    activeView === "budget"
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                Budget
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Scroll Area */}
            <div className={`flex-1 overflow-y-auto ${activeView === "itinerary" ? "px-3 py-3" : ""}`}>
                {activeView === "itinerary" ? (
                    days.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4 mx-3">
                            <p className="text-sm font-medium text-gray-600 mb-1">No itinerary yet.</p>
                            <p className="text-xs text-gray-400">Ask the AI to plan a trip!</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {days.map((dayData) => (
                                <div key={dayData.day} className="bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                    <button
                                        onClick={() => toggleDay(dayData.day)}
                                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">{dayData.day}</span>
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">Day {dayData.day}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{dayData.items.length} places</span>
                                            {expandedDays.includes(dayData.day) ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </button>

                                    {expandedDays.includes(dayData.day) && (
                                        <div className="px-3 pb-3 space-y-2">
                                            {dayData.items.map((item, idx) => (
                                                <div key={idx} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm cursor-default">
                                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                        <span className="text-base shrink-0">{item.type === "event" ? "🎉" : "📍"}</span>
                                                        <p className="text-xs font-semibold text-gray-900 flex-1 leading-tight line-clamp-2">{item.name}</p>
                                                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                                                            {item.category || item.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center gap-1 text-gray-400">
                                                            <Clock className="w-3 h-3" />
                                                            <span className="text-xs">
                                                                {item.startTime} {item.endTime ? `- ${item.endTime}` : ""}
                                                                {(!item.startTime && !item.endTime) ? "Anytime" : ""}
                                                            </span>
                                                        </div>
                                                        {item.rating && (
                                                            <div className="flex items-center gap-0.5">
                                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                                <span className="text-xs font-medium text-gray-700">{item.rating}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {dayData.items.length === 0 && (
                                                <div className="p-3 text-center text-xs text-gray-400 italic">No activities planned.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    <BudgetPanel data={budgetData} daysCount={days.length} />
                )}
            </div>

            {/* Bottom Action */}
            <div className="p-3 border-t border-gray-100 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button
                    onClick={onConfirm}
                    disabled={isConfirming || days.length === 0}
                    className={`w-full py-3 flex items-center justify-center rounded-xl font-medium text-sm transition-all duration-200 ${!isConfirming && days.length > 0
                            ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                >
                    {isConfirming ? (
                        <div className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating Trip...
                        </div>
                    ) : (
                        "Confirm & Create Trip"
                    )}
                </button>
            </div>
        </div>
    );
}
