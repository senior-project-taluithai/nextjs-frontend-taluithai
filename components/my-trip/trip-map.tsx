"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Star } from "lucide-react";
import Image from "next/image";

function isAllowedImageUrl(url: string): boolean {
    try {
        const u = new URL(url);
        return u.protocol === "https:" || u.protocol === "http:";
    } catch {
        return false;
    }
}

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

const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const violetIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const CATEGORY_LABELS: Record<string, string> = {
    temple: 'วัด',
    attraction: 'สถานที่ท่องเที่ยว',
    restaurant: 'ร้านอาหาร',
    restaurants: 'ร้านอาหาร',
    cafe: 'คาเฟ่',
    hotel: 'ที่พัก',
    park: 'สวนสาธารณะ',
    museum: 'พิพิธภัณฑ์',
    viewpoint: 'จุดชมวิว',
    event: 'กิจกรรม',
};

interface MapItem {
    id?: string | number;
    name: string;
    name_en?: string;
    type?: string;
    category?: string;
    latitude: number;
    longitude: number;
    rating?: number;
    thumbnail_url?: string;
}

interface TripMapProps {
    items: MapItem[];
    center?: [number, number];
    zoom?: number;
}

function getMarkerIcon(item: MapItem) {
    const cat = (item.category || item.type || '').toLowerCase();
    if (cat.includes('restaurant') || cat.includes('food') || cat.includes('cafe')) return greenIcon;
    if (cat.includes('hotel') || cat.includes('accommodation')) return violetIcon;
    if (cat.includes('temple') || cat.includes('วัด')) return goldIcon;
    if (cat === 'event') return redIcon;
    return blueIcon;
}

function getCategoryLabel(item: MapItem): string {
    const cat = (item.category || item.type || '').toLowerCase();
    return CATEGORY_LABELS[cat] || item.category || item.type || 'สถานที่';
}

// Internal component to handle view updates
function MapController({ items }: { items: MapItem[] }) {
    const map = useMap();

    useEffect(() => {
        if (items.length > 0) {
            const points = items
                .filter((i) => i.latitude && i.longitude)
                .map((i) => [i.latitude, i.longitude] as [number, number]);

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
    const validItems = items.filter((item) => item.latitude && item.longitude);

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

            {validItems.map((item: MapItem, idx: number) => {
                const icon = getMarkerIcon(item);
                const label = getCategoryLabel(item);
                const imageUrl = item.thumbnail_url;
                const safeImageUrl =
                    typeof imageUrl === "string" && isAllowedImageUrl(imageUrl)
                        ? imageUrl
                        : null;

                return (
                    <Marker
                        key={`${item.id || idx}-${item.name}`}
                        position={[item.latitude, item.longitude]}
                        icon={icon}
                    >
                        <Popup className="min-w-50">
                            <div className="flex flex-col gap-2">
                                {safeImageUrl && (
                                    <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100">
                                        <Image
                                            src={safeImageUrl}
                                            alt={item.name_en || item.name}
                                            fill
                                            className="object-cover"
                                            sizes="200px"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-sm leading-tight line-clamp-2">{item.name}</h3>
                                    {item.name_en && (
                                        <p className="text-xs text-muted-foreground line-clamp-1">{item.name_en}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                                    {item.rating && (
                                        <>
                                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                            {item.rating}
                                        </>
                                    )}
                                    <span className="text-muted-foreground font-normal ml-auto bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                                        {label}
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
