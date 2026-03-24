"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Input } from "@/components/ui/input";
import { MapPin, Trash2, GripVertical } from "lucide-react";

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

    const type = item.place_id ? 'place' : 'event';
    const itemId = item.place_id || item.event_id;
    const itemDetails = item.place || item.event;
    const name = itemDetails ? (itemDetails.name_en || itemDetails.name) : `${type === 'place' ? 'Place' : 'Event'} #${itemId}`;
    const imageUrl = itemDetails?.thumbnail_url;

    const badgeStyles = type === 'place' 
        ? 'bg-sky-100 text-sky-700 border border-sky-200' 
        : 'bg-amber-100 text-amber-700 border border-amber-200';

    return (
        <div ref={setNodeRef} style={style} className="relative mb-3 last:mb-0">
            <div className="relative group bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all flex gap-3">
                {!isLast && (
                    <div className="absolute left-[1.35rem] top-10 bottom-[-1.5rem] w-0.5 bg-gray-200 dark:bg-slate-700 -z-10" />
                )}

                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-500 -ml-1 pr-1"
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex flex-col items-center gap-1 min-w-[2.5rem]">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${badgeStyles}`}>
                        {index + 1}
                    </div>
                    {imageUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden mt-1 shadow-sm select-none pointer-events-none ring-1 ring-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h4 className="font-semibold text-sm text-gray-900 truncate" title={name}>
                            {name}
                        </h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {item.note || (itemDetails?.province?.name_en || 'No details available')}
                    </p>

                    <div className="flex items-center gap-2 mt-2 w-full bg-gray-50 rounded-lg p-1.5">
                        <Input
                            type="time"
                            className="h-7 text-xs px-2 bg-white border-gray-200 focus:border-sky-300 focus:ring-sky-100"
                            value={item.start_time || ""}
                            onChange={(e) => onTimeChange(item.id, 'start_time', e.target.value)}
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                        <span className="text-xs text-gray-400 font-medium shrink-0">—</span>
                        <Input
                            type="time"
                            className="h-7 text-xs px-2 text-center bg-white border-gray-200 focus:border-sky-300 focus:ring-sky-100"
                            value={item.end_time || ""}
                            onChange={(e) => onTimeChange(item.id, 'end_time', e.target.value)}
                            onPointerDown={(e) => e.stopPropagation()}
                        />
                    </div>

                    <button
                        onClick={() => onRemove(item.id)}
                        className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-transparent hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}