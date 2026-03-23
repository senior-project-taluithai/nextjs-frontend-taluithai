"use client";

import { useState } from "react";
import {
  Clock,
  Star,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Hotel,
} from "lucide-react";
import { BudgetPanel } from "@/components/ai-planner/budget-panel";
import { HotelPanel } from "@/components/ai-planner/hotel-panel";
import type { BudgetData, HotelData, RouteData } from "@/hooks/useAgentChat";
import { Car, Info } from "lucide-react";

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
  hotelData?: HotelData | null;
  routeData?: RouteData | null;
  selectedHotelIndexes?: Set<number>;
  onSelectHotel?: (index: number) => void;
  hotelAssignments?: Record<number, number>;
  onAssignHotel?: (night: number, hotelIndex: number) => void;
  onOptimizeHotels?: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
}

export function TripResultPanel({
  tripName,
  days,
  budget: _budget,
  budgetData,
  hotelData,
  routeData,
  selectedHotelIndexes,
  onSelectHotel,
  hotelAssignments,
  onAssignHotel,
  onOptimizeHotels,
  onConfirm,
  isConfirming,
}: TripResultPanelProps) {
  const totalPlaces = days.reduce((sum, d) => sum + d.items.length, 0);
  // Initialize expanded days array with all days initially expanded
  const [expandedDays, setExpandedDays] = useState<number[]>(
    days.map((d) => d.day),
  );
  const [activeView, setActiveView] = useState<
    "itinerary" | "hotels" | "budget"
  >("itinerary");

  const hasTabs = !!(budgetData || hotelData);
  const tabs: { key: typeof activeView; label: string }[] = [
    { key: "itinerary", label: "Itinerary" },
    ...(hotelData ? [{ key: "hotels" as const, label: "Hotels" }] : []),
    ...(budgetData ? [{ key: "budget" as const, label: "Budget" }] : []),
  ];

  // Update expandedDays if days prop changes and new days are added
  // This simple approach just ensures newly planned days are visible
  // A more robust approach might be needed if days change dramatically,
  // but typically it's appended sequentially.

  const toggleDay = (day: number) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white w-full pointer-events-auto">
      {/* Trip Info Header - only show when there's a trip */}
      {days.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">
                {tripName || "New Trip"}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {days.length} days
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {totalPlaces} places
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs - show when there's hotel/budget data OR a trip */}
      {hasTabs && (
        <div className="px-4 py-3 border-b border-gray-100 bg-white">
          <div
            className={`grid gap-2 rounded-lg bg-gray-50 p-1`}
            style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveView(tab.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeView === tab.key
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scroll Area */}
      <div
        className={`flex-1 overflow-y-auto ${activeView === "itinerary" ? "px-3 py-3" : ""}`}
      >
        {activeView === "hotels" ? (
          <HotelPanel
            data={hotelData}
            selectedIndexes={selectedHotelIndexes}
            onSelectHotel={onSelectHotel}
            tripDays={days.length}
            hotelAssignments={hotelAssignments}
            onAssignHotel={onAssignHotel}
            onOptimizeHotels={onOptimizeHotels}
          />
        ) : activeView === "itinerary" ? (
          days.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-4 mx-3">
              <p className="text-sm font-medium text-gray-600 mb-1">
                No itinerary yet.
              </p>
              <p className="text-xs text-gray-400">
                Ask the AI to plan a trip!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {days.map((dayData, dayIdx) => {
                const routeDay = routeData?.itinerary?.find(
                  (r) => r.day === dayData.day,
                );
                return (
                  <div
                    key={`${dayData.day}-${dayIdx}`}
                    className="bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100"
                  >
                    <button
                      onClick={() => toggleDay(dayData.day)}
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {dayData.day}
                          </span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">
                          Day {dayData.day}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {routeDay && (
                          <span className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            <Car className="w-3 h-3" />
                            {routeDay.daily_distance_km.toFixed(1)} km
                            <span className="text-blue-400">·</span>
                            {routeDay.daily_duration_mins} min
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {dayData.items.length} places
                        </span>
                        {expandedDays.includes(dayData.day) ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedDays.includes(dayData.day) && (
                      <div className="px-3 pb-3 space-y-2">
                        {routeDay?.transit_advice && (
                          <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-blue-700">
                              {routeDay.transit_advice}
                            </span>
                          </div>
                        )}
                        {dayData.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm cursor-default"
                          >
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="text-base shrink-0">
                                {item.type === "event" ? "🎉" : "📍"}
                              </span>
                              <p className="text-xs font-semibold text-gray-900 flex-1 leading-tight line-clamp-2">
                                {item.name}
                              </p>
                              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase shrink-0">
                                {item.category || item.type}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1 text-gray-400">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">
                                  {item.startTime}{" "}
                                  {item.endTime ? `- ${item.endTime}` : ""}
                                  {!item.startTime && !item.endTime
                                    ? "Anytime"
                                    : ""}
                                </span>
                              </div>
                              {item.rating && (
                                <div className="flex items-center gap-0.5">
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  <span className="text-xs font-medium text-gray-700">
                                    {item.rating}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {dayData.items.length === 0 && (
                          <div className="p-3 text-center text-xs text-gray-400 italic">
                            No activities planned.
                          </div>
                        )}
                        {dayData.day < days.length &&
                          hotelAssignments &&
                          hotelAssignments[dayData.day] !== undefined &&
                          hotelData?.hotels[hotelAssignments[dayData.day]] && (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mt-2">
                              <Hotel className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-xs text-emerald-700">
                                Overnight:{" "}
                                {
                                  hotelData.hotels[
                                    hotelAssignments[dayData.day]
                                  ].name
                                }
                              </span>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
              {routeData?.summary && (
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-medium text-blue-800">
                    <Car className="w-4 h-4" />
                    <span>
                      Total driving:{" "}
                      {routeData.summary.total_driving_distance_km.toFixed(1)}{" "}
                      km
                    </span>
                    <span className="text-blue-400">·</span>
                    <span>
                      {Math.round(
                        routeData.summary.total_driving_duration_mins,
                      )}{" "}
                      min
                    </span>
                  </div>
                  {routeData.summary.hotels_used.length > 0 && (
                    <div className="mt-1.5 text-[10px] text-blue-600">
                      {routeData.summary.hotels_used.map((h, i) => (
                        <span key={i}>
                          {h.name} ({h.nights} night{h.nights > 1 ? "s" : ""})
                          {i < routeData.summary.hotels_used.length - 1
                            ? " · "
                            : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
          className={`w-full py-3 flex items-center justify-center rounded-xl font-medium text-sm transition-all duration-200 ${
            !isConfirming && days.length > 0
              ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isConfirming ? (
            <div className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
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
