"use client";

import { Clock, Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TripDayItem {
    id?: string;
    name: string;
    type: "place" | "event";
    pg_place_id?: number;
    raw_id?: number;
    event_id?: number;
    latitude?: number;
    longitude?: number;
    startTime?: string;
    endTime?: string;
    thumbnail_url?: string;
    rating?: number;
    category?: string;
}

interface TripDayCardsProps {
    days: {
        day: number;
        items: TripDayItem[];
    }[];
    onViewOnMap?: (lat: number, lng: number, id?: string) => void;
}

export function TripDayCards({ days, onViewOnMap }: TripDayCardsProps) {
    if (!days || days.length === 0) return null;

    return (
        <div className="space-y-4 my-3">
            {days.map((day, dayIndex) => (
                <div key={`day-${day.day}-${dayIndex}`}>
                    <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Day {day.day}
                    </h4>
                    {/* Horizontal scroll container */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                        {day.items.map((item, idx) => {
                            const hasCoords = item.latitude && item.longitude;
                            const itemId = item.id || `day-${day.day}-item-${idx}-${item.name}`;

                            const content = (
                                <>
                                {/* Thumbnail */}
                                <div className="w-full h-24 bg-muted flex items-center justify-center overflow-hidden">
                                    {item.thumbnail_url ? (
                                        <img
                                            src={item.thumbnail_url}
                                            alt={item.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                                    <p className="text-xs font-medium line-clamp-2 leading-tight mb-1.5 group-hover:text-emerald-600 transition-colors">
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
                                </>
                            );

                            return hasCoords ? (
                                <div
                                    key={`item-${itemId}`}
                                    onClick={() => onViewOnMap?.(item.latitude!, item.longitude!, itemId)}
                                    className="group flex-none w-44 rounded-lg border bg-card shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden cursor-pointer"
                                >
                                    {content}
                                </div>
                            ) : (
                                <div
                                    key={`item-no-id-${idx}`}
                                    className="flex-none w-44 rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                                >
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}