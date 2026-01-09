"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Place, Event } from "@/lib/mock-data";
import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

// Leaflet Icon Fix for Next.js
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
const customIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

interface ExploreMapProps {
    items: (Place | Event)[];
    center?: [number, number];
    zoom?: number;
}

// Internal component to handle view updates
function MapController({ items }: { items: (Place | Event)[] }) {
    const map = useMap();

    useEffect(() => {
        if (items.length > 0) {
            const points = items
                .filter((i: any) => i.latitude && i.longitude)
                .map((i: any) => [i.latitude, i.longitude] as [number, number]);

            if (points.length > 0) {
                const bounds = L.latLngBounds(points);
                if (bounds.isValid()) {
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            }
        }
    }, [items, map]);

    return null;
}

export default function ExploreMap({ items, center = [13.7563, 100.5018], zoom = 6 }: ExploreMapProps) {
    const validItems = items.filter((item: any) => item.latitude && item.longitude);

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className="w-full h-full rounded-xl z-0"
            scrollWheelZoom={true}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController items={validItems} />

            {validItems.map((item: any) => {
                const isPlace = 'place_id' in item;
                const id = isPlace ? item.place_id : item.event_id;
                const type = isPlace ? 'place' : 'event';
                const imageUrl = isPlace ? item.thumbnail_url : item.image_url;

                return (
                    <Marker
                        key={`${type}-${id}`}
                        position={[item.latitude, item.longitude]}
                        icon={customIcon}
                    >
                        <Popup className="min-w-[200px]">
                            <div className="flex flex-col gap-2">
                                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100">
                                    <Image
                                        src={imageUrl}
                                        alt={item.name_en}
                                        fill
                                        className="object-cover"
                                        sizes="200px"
                                    />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{item.name_en}</h3>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{item.name}</p>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    {item.rating} <span className="text-muted-foreground font-normal">({item.reviews?.length || 0})</span>
                                </div>
                                <Link
                                    href={`/${type}/${id}`}
                                    className="text-xs text-center w-full bg-primary text-white py-1.5 rounded hover:bg-primary/90 transition-colors mt-1"
                                >
                                    View Details
                                </Link>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
