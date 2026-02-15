"use strict";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";

interface TripItem {
    id?: string;
    name: string;
    type: string;
    startTime?: string;
    endTime?: string;
}

interface TripDay {
    day: number;
    items: TripItem[];
}

interface TripResultPanelProps {
    tripName: string;
    days: TripDay[];
    onConfirm: () => void;
    isConfirming: boolean;
}

export function TripResultPanel({ tripName, days, onConfirm, isConfirming }: TripResultPanelProps) {
    return (
        <div className="flex flex-col h-full bg-background/95 backdrop-blur-sm border-r shadow-lg w-full max-w-md pointer-events-auto">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-bold tracking-tight mb-2">{tripName || "New Trip"}</h2>
                <div className="flex gap-2">
                    <Badge variant="outline">{days.length} Days</Badge>
                    <Badge variant="secondary">Draft</Badge>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                {days.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p>No itinerary generated yet.</p>
                        <p className="text-sm">Ask the AI to plan a trip!</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {days.map((day) => (
                            <div key={day.day} className="relative pl-6 border-l-2 border-muted pb-4 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                                <h3 className="text-lg font-semibold mb-4 text-primary">Day {day.day}</h3>

                                <div className="space-y-4">
                                    {day.items.map((item, idx) => (
                                        <div key={idx} className="bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-1">
                                                <span className="font-medium text-sm line-clamp-1">{item.name}</span>
                                                <Badge variant={item.type === 'event' ? "secondary" : "outline"} className="text-[10px] h-5 px-1.5 uppercase">
                                                    {item.type}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                                {(item.startTime || item.endTime) && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        <span>{item.startTime} - {item.endTime}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {day.items.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">No activities planned.</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 border-t bg-muted/20">
                <Button className="w-full" size="lg" onClick={onConfirm} disabled={isConfirming || days.length === 0}>
                    {isConfirming ? "Creating Trip..." : "Confirm & Create Trip"}
                </Button>
            </div>
        </div>
    );
}
