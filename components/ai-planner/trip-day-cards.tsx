"use client";

import { Clock, Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PlannedDay } from "@/hooks/useAgentChat";

interface TripDayCardsProps {
    days: PlannedDay[];
}

export function TripDayCards({ days }: TripDayCardsProps) {
    if (!days || days.length === 0) return null;

    return (
        <div className="space-y-4 my-3">
            {days.map((day) => (
                <div key={day.day}>
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Day {day.day}
                    </h4>
                    {/* Horizontal scroll container */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        {day.items.map((item, idx) => (
                            <div
                                key={item.id || idx}
                                className="flex-none w-44 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                            >
                                {/* Thumbnail */}
                                <div className="w-full h-24 bg-muted flex items-center justify-center overflow-hidden">
                                    {item.thumbnail_url ? (
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.style.display = "none";
                                                e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                            }}
                                        />
                                    ) : null}
                                    <MapPin className={`w-6 h-6 text-muted-foreground/40 ${item.thumbnail_url ? "hidden" : ""}`} />
                                </div>
                                {/* Info */}
                                <div className="p-2.5">
                                    <p className="text-xs font-medium line-clamp-2 leading-tight mb-1.5">
                                        {item.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {item.category && (
                                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                                                {item.category}
                                            </Badge>
                                        )}
                                        {item.rating && (
                                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                                {item.rating}
                                            </span>
                                        )}
                                    </div>
                                    {(item.startTime || item.endTime) && (
                                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                                            <Clock className="w-2.5 h-2.5" />
                                            <span>{item.startTime} - {item.endTime}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
