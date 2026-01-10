"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

// Leaflet Icons
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png';

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const goldIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface TripMapProps {
    items: any[]; // Place or Event objects with location data
    center?: [number, number];
    zoom?: number;
}

// Internal component to handle view updates
function MapController({ items }: { items: any[] }) {
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

export default function TripMap({ items, center = [13.7563, 100.5018], zoom = 10 }: TripMapProps) {
    // Filter items with valid coordinates
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

                // Determine Icon
                let icon = blueIcon;
                if (!isPlace) icon = redIcon;
                // You could add logic for "Saved" or "Highlight" here

                return (
                    <Marker
                        key={`${type}-${id}`}
                        position={[item.latitude, item.longitude]}
                        icon={icon}
                    >
                        <Popup className="min-w-[200px]">
                            <div className="flex flex-col gap-2">
                                <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100">
                                    <Image
                                        src={imageUrl}
                                        alt={item.name_en || item.name}
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
                                    {item.rating}
                                    <span className="text-muted-foreground font-normal ml-auto capitalize bg-slate-100 px-1 rounded">
                                        {type}
                                    </span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
