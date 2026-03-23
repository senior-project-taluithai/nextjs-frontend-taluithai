"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Dynamically import map to avoid SSR issues
const TripMap = dynamic(() => import("@/components/my-trip/trip-map"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-muted/10 animate-pulse flex items-center justify-center">Loading Map...</div>
});

import type { RouteGeometry } from "@/components/my-trip/trip-map";

interface BackgroundMapProps {
    items: any[];
    routeGeometries?: RouteGeometry[];
}

export function BackgroundMap({ items, routeGeometries }: BackgroundMapProps) {
    // Transform items if necessary to match TripMap expectations
    const mapItems = useMemo(() => {
        return items.map(item => ({
            ...item,
            // Ensure mock data has lat/lng if missing
            latitude: item.latitude || 13.7563,
            longitude: item.longitude || 100.5018
        }));
    }, [items]);

    return (
        <div className="fixed inset-0 z-[5] w-full h-full pointer-events-auto">
            <TripMap items={mapItems} routeGeometries={routeGeometries} />
            {/* Overlay to dim map slightly so UI pops */}
            <div className="absolute inset-0 bg-background/5 pointer-events-none" />
        </div>
    );
}
