"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
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

// Leaflet Icons - Custom SVG markers for each category
function createSvgIcon(color: string, svgContent: string): L.DivIcon {
    return L.divIcon({
        html: `<div style="
            width: 36px;
            height: 44px;
            background: ${color};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: white;" 
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${svgContent}
            </svg>
        </div>`,
        className: '',
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -44]
    });
}

// Category-specific SVG icons (hybrid style: same shape, category-specific icon inside)
const hotelIcon = createSvgIcon('#7C3AED', `
    <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/>
    <path d="M3 21h18"/>
    <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
    <line x1="9" y1="10" x2="9" y2="10"/>
    <line x1="15" y1="10" x2="15" y2="10"/>
`);

const templeIcon = createSvgIcon('#f59e0b', `
    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    <path d="M2 17l10 5 10-5"/>
    <path d="M2 12l10 5 10-5"/>
`);

const restaurantIcon = createSvgIcon('#10b981', `
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
`);

const cafeIcon = createSvgIcon('#f59e0b', `
    <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
`);

const parkIcon = createSvgIcon('#10b981', `
    <path d="M12 22v-7"/>
    <path d="M12 15c-3 0-6-2-6-6 0-2 2-5 6-9 4 4 6 7 6 9 0 4-3 6-6 6z"/>
`);

const museumIcon = createSvgIcon('#64748b', `
    <path d="M3 22h18"/>
    <path d="M6 18v-7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7"/>
    <path d="M4 18h16"/>
    <path d="M10 18v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4"/>
    <path d="M3 22V8l9-4 9 4v14"/>
`);

const viewpointIcon = createSvgIcon('#0ea5e9', `
    <path d="M8 3l4 8 5-5 5 15H2L8 3z"/>
`);

const eventIcon = createSvgIcon('#ef4444', `
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
`);

// Color-only icons (no specific icon, just colored marker)
const beachIcon = createSvgIcon('#0ea5e9', `<circle cx="12" cy="12" r="4"/>`);
const natureIcon = createSvgIcon('#10b981', `<circle cx="12" cy="12" r="4"/>`);
const islandIcon = createSvgIcon('#14b8a6', `<circle cx="12" cy="12" r="4"/>`);
const heritageIcon = createSvgIcon('#f43f5e', `<circle cx="12" cy="12" r="4"/>`);
const shoppingIcon = createSvgIcon('#ec4899', `<circle cx="12" cy="12" r="4"/>`);
const marketIcon = createSvgIcon('#f97316', `<circle cx="12" cy="12" r="4"/>`);
const attractionIcon = createSvgIcon('#3b82f6', `<circle cx="12" cy="12" r="4"/>`);

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
    priceRange?: string;
    bookingUrl?: string;
    address?: string;
}

export interface RouteGeometry {
    day: number;
    coordinates: [number, number][]; // [lng, lat] from GeoJSON
}

interface TripMapProps {
    items: MapItem[];
    routeGeometries?: RouteGeometry[];
    center?: [number, number];
    zoom?: number;
}

const DAY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function getMarkerIcon(item: MapItem) {
    const cat = (item.category || item.type || '').toLowerCase();
    
    // Hotel
    if (cat.includes('hotel') || cat.includes('accommodation')) return hotelIcon;
    
    // Temple (วัด)
    if (cat.includes('temple') || cat.includes('วัด')) return templeIcon;
    
    // Restaurant (ร้านอาหาร)
    if (cat.includes('restaurant') || cat.includes('food')) return restaurantIcon;
    
    // Cafe (คาเฟ่)
    if (cat.includes('cafe') || cat.includes('coffee')) return cafeIcon;
    
    // Park (สวนสาธารณะ)
    if (cat.includes('park') || cat.includes('สวน')) return parkIcon;
    
    // Museum (พิพิธภัณฑ์)
    if (cat.includes('museum') || cat.includes('พิพิธ')) return museumIcon;
    
    // Viewpoint (จุดชมวิว)
    if (cat.includes('viewpoint') || cat.includes('mountain') || cat.includes('ภูเขา')) return viewpointIcon;
    
    // Event (กิจกรรม)
    if (cat.includes('event') || cat.includes('festival') || cat.includes('กิจกรรม')) return eventIcon;
    
    // Beach
    if (cat.includes('beach') || cat.includes('ทะเล')) return beachIcon;
    
    // Nature
    if (cat.includes('nature') || cat.includes('ธรรมชาติ')) return natureIcon;
    
    // Island
    if (cat.includes('island') || cat.includes('เกาะ')) return islandIcon;
    
    // Heritage
    if (cat.includes('heritage') || cat.includes('มรดก')) return heritageIcon;
    
    // Shopping
    if (cat.includes('shop') || cat.includes('shopping')) return shoppingIcon;
    
    // Market
    if (cat.includes('market') || cat.includes('ตลาด')) return marketIcon;
    
    // Attraction (default)
    return attractionIcon;
}

function getCategoryLabel(item: MapItem): string {
    const cat = (item.category || item.type || '').toLowerCase();
    
    if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
    
    // Fallback label mapping
    if (cat.includes('cafe') || cat.includes('coffee')) return 'คาเฟ่';
    if (cat.includes('beach') || cat.includes('ทะเล')) return 'ชายหาด';
    if (cat.includes('nature') || cat.includes('ธรรมชาติ')) return 'ธรรมชาติ';
    if (cat.includes('island') || cat.includes('เกาะ')) return 'เกาะ';
    if (cat.includes('heritage') || cat.includes('มรดก')) return 'มรดก';
    if (cat.includes('shop') || cat.includes('shopping')) return 'ช้อปปิ้ง';
    if (cat.includes('market') || cat.includes('ตลาด')) return 'ตลาด';
    
    return item.category || item.type || 'สถานที่';
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

export default function TripMap({ items, routeGeometries, center = [13.7563, 100.5018], zoom = 10 }: TripMapProps) {
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

            {/* Route polylines */}
            {routeGeometries?.map((route) => {
                const color = DAY_COLORS[(route.day - 1) % DAY_COLORS.length];
                // GeoJSON coordinates are [lng, lat], Leaflet needs [lat, lng]
                const positions = route.coordinates.map(
                    ([lng, lat]) => [lat, lng] as [number, number]
                );
                return (
                    <Polyline
                        key={`route-day-${route.day}`}
                        positions={positions}
                        pathOptions={{ color, weight: 4, opacity: 0.7 }}
                    />
                );
            })}

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
                                    {item.address && (
                                        <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{item.address}</p>
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
                                {item.category?.toLowerCase().includes('hotel') && item.priceRange && (
                                    <div className="flex items-center justify-between pt-1 border-t">
                                        <span className="text-xs font-bold text-emerald-600">
                                            ฿{item.priceRange}/night
                                        </span>
                                        {item.bookingUrl && (
                                            <a
                                                href={item.bookingUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded transition-colors"
                                            >
                                                Book
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
