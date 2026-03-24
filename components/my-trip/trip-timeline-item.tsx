"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Trash2, GripVertical, Calendar } from "lucide-react";

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
        opacity: isDragging ? 0.7 : 1,
        zIndex: isDragging ? 1000 : 1,
        position: 'relative' as const,
    };

    // Data extraction logic
    const type = item.place_id ? 'place' : 'event';
    const itemId = item.place_id || item.event_id;
    const itemDetails = item.place || item.event;
    const name = itemDetails ? (itemDetails.name_en || itemDetails.name) : `${type === 'place' ? 'Place' : 'Event'} #${itemId}`;
    const imageUrl = itemDetails?.thumbnail_url;

    const typeConfig = type === 'place' 
        ? { bg: 'bg-sky-500', lightBg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100', label: 'PLACE' }
        : { bg: 'bg-amber-500', lightBg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'EVENT' };

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {/* Timeline connector line */}
            {!isLast && (
                <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-gray-100" />
            )}
            
            <div className={`relative group rounded-2xl border transition-all duration-200 ${isDragging ? 'shadow-xl border-gray-300 bg-white' : 'bg-white hover:shadow-md border-gray-100 hover:border-gray-200'}`}>
                <div className="flex gap-3 p-3">
                    {/* Left: Order + Image */}
                    <div className="flex flex-col items-center gap-2">
                        {/* Drag Handle + Number */}
                        <div
                            {...attributes}
                            {...listeners}
                            className={`w-10 h-10 rounded-xl ${typeConfig.bg} text-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow`}
                        >
                            <span className="font-bold text-sm">{index + 1}</span>
                        </div>
                        
                        {/* Thumbnail */}
                        {imageUrl && (
                            <div className="w-14 h-14 rounded-xl overflow-hidden shadow-sm border border-gray-100 select-none pointer-events-none">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 py-0.5">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0 flex-1">
                                <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1" title={name}>
                                    {name}
                                </h4>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 line-clamp-1">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{item.note || (itemDetails?.province?.name_en || 'Location')}</span>
                                </p>
                            </div>
                            <Badge className={`shrink-0 text-[9px] h-5 px-2 font-semibold ${typeConfig.lightBg} ${typeConfig.text} ${typeConfig.border} border`}>
                                {typeConfig.label}
                            </Badge>
                        </div>

                        {/* Time Inputs */}
                        <div className="flex items-center gap-2 mt-3 bg-gray-50 rounded-xl p-2">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <Input
                                type="time"
                                className="h-7 text-xs bg-white border-gray-200 rounded-lg px-2 font-medium"
                                value={item.start_time || ""}
                                onChange={(e) => onTimeChange(item.id, 'start_time', e.target.value)}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                            <span className="text-xs text-gray-300 font-medium">to</span>
                            <Input
                                type="time"
                                className="h-7 text-xs bg-white border-gray-200 rounded-lg px-2 font-medium"
                                value={item.end_time || ""}
                                onChange={(e) => onTimeChange(item.id, 'end_time', e.target.value)}
                                onPointerDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Remove Button */}
                    <button
                        onClick={() => onRemove(item.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        onPointerDown={(e) => e.stopPropagation()}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
