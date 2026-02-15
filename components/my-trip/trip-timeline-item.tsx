"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Trash2, GripVertical } from "lucide-react";

interface TripTimelineItemProps {
    item: any;
    index: number;
    isLast: boolean;
    onRemove: (id: number) => void;
    onTimeChange: (id: number, field: 'start_time' | 'end_time', value: string) => void;
}

export function TripTimelineItem({
    item,
    index,
    isLast,
    onRemove,
    onTimeChange
}: TripTimelineItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
    };

    // Data extraction logic
    const type = item.place_id ? 'place' : 'event';
    const itemId = item.place_id || item.event_id;
    const itemDetails = item.place || item.event;
    const name = itemDetails ? (itemDetails.name_en || itemDetails.name) : `${type === 'place' ? 'Place' : 'Event'} #${itemId}`;
    const imageUrl = itemDetails?.thumbnail_url;

    return (
        <div ref={setNodeRef} style={style} className="relative mb-3 last:mb-0">
            <div className="relative group bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm flex gap-3">
                {/* Timeline Connector */}
                {!isLast && (
                    <div className="absolute left-[2.4rem] top-10 bottom-[-1.5rem] w-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
                )}

                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 -ml-1 pr-1"
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                {/* Order Indicator */}
                <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${type === 'place' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                        {index + 1}
                    </div>
                    {/* Thumbnail if available */}
                    {imageUrl && (
                        <div className="w-10 h-10 rounded-md overflow-hidden mt-1 shadow-sm select-none pointer-events-none">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-sm truncate pr-6" title={name}>
                            {name}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase">
                            {type}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {item.note || (itemDetails?.province?.name_en || 'No details available')}
                    </p>

                    {/* Time Inputs */}
                    <div className="flex items-center gap-2 mt-3 w-full">
                        <div className="relative flex-1">
                            <Clock className="absolute left-2 top-1.5 w-3 h-3 text-muted-foreground" />
                            <Input
                                type="time"
                                className="h-6 text-xs pl-6"
                                value={item.start_time || ""}
                                onChange={(e) => onTimeChange(item.id, 'start_time', e.target.value)}
                                // Prevent drag when interacting with input
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>
                        <span className="text-xs text-muted-foreground">-</span>
                        <div className="relative flex-1">
                            <Input
                                type="time"
                                className="h-6 text-xs px-1 text-center"
                                value={item.end_time || ""}
                                onChange={(e) => onTimeChange(item.id, 'end_time', e.target.value)}
                                // Prevent drag when interacting with input
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={() => onRemove(item.id)}
                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        // Prevent drag when clicking remove
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
