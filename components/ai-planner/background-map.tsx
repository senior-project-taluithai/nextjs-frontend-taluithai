"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

// Dynamically import map to avoid SSR issues
const TripMap = dynamic(() => import("@/components/my-trip/trip-map"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-muted/10 animate-pulse flex items-center justify-center">Loading Map...</div>
});

import type { RouteGeometry } from "@/components/my-trip/trip-map";

interface BackgroundMapItem {
    id?: string | number;
    name: string;
    name_en?: string;
    type?: string;
    category?: string;
    latitude: number;
    longitude: number;
    rating?: number;
    thumbnail_url?: string;
    priceRange?: string;
    bookingUrl?: string;
    address?: string;
    event_id?: number;
    pg_place_id?: number;
    raw_id?: number;
    itemType?: "place" | "event" | "hotel";
}

interface BackgroundMapProps {
    items: BackgroundMapItem[];
    routeGeometries?: RouteGeometry[];
    focusedLocation?: { lat: number; lng: number; id?: string | number } | null;
}

export function BackgroundMap({ items, routeGeometries, focusedLocation }: BackgroundMapProps) {
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
        <div className="absolute inset-0 z-[5] w-full h-full pointer-events-auto overflow-hidden">
            <TripMap items={mapItems} routeGeometries={routeGeometries} focusedLocation={focusedLocation} />
            {/* Overlay to dim map slightly so UI pops */}
            <div className="absolute inset-0 bg-background/5 pointer-events-none" />
        </div>
    );
}
