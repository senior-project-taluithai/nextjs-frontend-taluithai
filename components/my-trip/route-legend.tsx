"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const DAY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
const DAY_COLOR_NAMES = ['Blue', 'Green', 'Yellow', 'Red', 'Purple', 'Pink', 'Teal'];

interface RouteLegendProps {
    days: number[];
}

export function RouteLegend({ days }: RouteLegendProps) {
    const [showLegend, setShowLegend] = useState(true);

    if (days.length === 0) return null;

    return (
        <div className="absolute top-4 left-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
                <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    <span>Route</span>
                    {showLegend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {showLegend && (
                    <div className="px-3 pb-3 space-y-1.5">
                        {days.sort((a, b) => a - b).map((day) => {
                            const color = DAY_COLORS[(day - 1) % DAY_COLORS.length];
                            const colorName = DAY_COLOR_NAMES[(day - 1) % DAY_COLOR_NAMES.length];
                            return (
                                <div key={day} className="flex items-center gap-2 text-xs">
                                    <div
                                        className="w-4 h-1.5 rounded-full"
                                        style={{ backgroundColor: color }}
                                    />
                                    <span className="text-slate-600">Route {colorName} - Day {day}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}