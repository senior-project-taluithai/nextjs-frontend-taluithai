"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    className?: string;
    size?: number;
}

export function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readonly = false,
    className,
    size = 5
}: StarRatingProps) {
    return (
        <div className={cn("flex gap-1", className)}>
            {Array.from({ length: maxRating }).map((_, index) => {
                const isFilled = index < Math.round(rating);
                // For input, we use the raw index + 1
                const starValue = index + 1;

                return (
                    <button
                        key={index}
                        type="button"
                        disabled={readonly}
                        onClick={() => onRatingChange?.(starValue)}
                        className={cn(
                            "transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded-sm",
                            readonly ? "cursor-default" : "cursor-pointer hover:scale-110 active:scale-95"
                        )}
                    >
                        <Star
                            className={cn(
                                "fill-current transition-colors",
                                isFilled ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30 fill-transparent",
                                `w-${size} h-${size}`
                            )}
                            style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                        />
                    </button>
                );
            })}
        </div>
    );
}
