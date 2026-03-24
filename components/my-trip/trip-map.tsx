"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
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
// PRE-COMPUTED: Created once outside component to avoid recreation on every render
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
    className: "",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

// Cluster icon (used when markers are grouped)
function createClusterIcon(count: number): L.DivIcon {
  return L.divIcon({
    html: `<div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
        ">${count}</div>`,
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// PRE-COMPUTED ICONS: Created once at module load, not per render
const CATEGORY_ICONS: Record<string, L.DivIcon> = {
  hotel: createSvgIcon(
    "#7C3AED",
    `
        <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/>
        <path d="M3 21h18"/>
        <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
        <line x1="9" y1="10" x2="9" y2="10"/>
        <line x1="15" y1="10" x2="15" y2="10"/>
    `,
  ),
  temple: createSvgIcon(
    "#f59e0b",
    `
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
    `,
  ),
  restaurant: createSvgIcon(
    "#10b981",
    `
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
        <path d="M7 2v20"/>
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
    `,
  ),
  cafe: createSvgIcon(
    "#f59e0b",
    `
        <path d="M17 8h1a4 4 0 1 1 0 8h-1"/>
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
        <line x1="6" y1="1" x2="6" y2="4"/>
        <line x1="10" y1="1" x2="10" y2="4"/>
        <line x1="14" y1="1" x2="14" y2="4"/>
    `,
  ),
  park: createSvgIcon(
    "#10b981",
    `
        <path d="M12 22v-7"/>
        <path d="M12 15c-3 0-6-2-6-6 0-2 2-5 6-9 4 4 6 7 6 9 0 4-3 6-6 6z"/>
    `,
  ),
  museum: createSvgIcon(
    "#64748b",
    `
        <path d="M3 22h18"/>
        <path d="M6 18v-7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7"/>
        <path d="M4 18h16"/>
        <path d="M10 18v-4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4"/>
        <path d="M3 22V8l9-4 9 4v14"/>
    `,
  ),
  viewpoint: createSvgIcon(
    "#0ea5e9",
    `
        <path d="M8 3l4 8 5-5 5 15H2L8 3z"/>
    `,
  ),
  event: createSvgIcon(
    "#ef4444",
    `
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    `,
  ),
  beach: createSvgIcon("#0ea5e9", `<circle cx="12" cy="12" r="4"/>`),
  nature: createSvgIcon("#10b981", `<circle cx="12" cy="12" r="4"/>`),
  island: createSvgIcon("#14b8a6", `<circle cx="12" cy="12" r="4"/>`),
  heritage: createSvgIcon("#f43f5e", `<circle cx="12" cy="12" r="4"/>`),
  shopping: createSvgIcon("#ec4899", `<circle cx="12" cy="12" r="4"/>`),
  market: createSvgIcon("#f97316", `<circle cx="12" cy="12" r="4"/>`),
  attraction: createSvgIcon("#3b82f6", `<circle cx="12" cy="12" r="4"/>`),
  default: createSvgIcon("#3b82f6", `<circle cx="12" cy="12" r="4"/>`),
};

const CATEGORY_LABELS: Record<string, string> = {
  temple: "วัด",
  attraction: "สถานที่ท่องเที่ยว",
  restaurant: "ร้านอาหาร",
  restaurants: "ร้านอาหาร",
  cafe: "คาเฟ่",
  hotel: "ที่พัก",
  park: "สวนสาธารณะ",
  museum: "พิพิธภัณฑ์",
  viewpoint: "จุดชมวิว",
  event: "กิจกรรม",
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
  event_id?: number;
  pg_place_id?: number;
  raw_id?: number;
  itemType?: "place" | "event" | "hotel";
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
  focusedLocation?: { lat: number; lng: number; id?: string | number } | null;
}

const DAY_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

function getMarkerIcon(item: MapItem): L.DivIcon {
  const cat = (item.category || item.type || "").toLowerCase();

  // Hotel
  if (cat.includes("hotel") || cat.includes("accommodation"))
    return CATEGORY_ICONS.hotel;

  // Temple (วัด)
  if (cat.includes("temple") || cat.includes("วัด"))
    return CATEGORY_ICONS.temple;

  // Restaurant (ร้านอาหาร)
  if (cat.includes("restaurant") || cat.includes("food"))
    return CATEGORY_ICONS.restaurant;

  // Cafe (คาเฟ่)
  if (cat.includes("cafe") || cat.includes("coffee"))
    return CATEGORY_ICONS.cafe;

  // Park (สวนสาธารณะ)
  if (cat.includes("park") || cat.includes("สวน")) return CATEGORY_ICONS.park;

  // Museum (พิพิธภัณฑ์)
  if (cat.includes("museum") || cat.includes("พิพิธ"))
    return CATEGORY_ICONS.museum;

  // Viewpoint (จุดชมวิว)
  if (
    cat.includes("viewpoint") ||
    cat.includes("mountain") ||
    cat.includes("ภูเขา")
  )
    return CATEGORY_ICONS.viewpoint;

  // Event (กิจกรรม)
  if (
    cat.includes("event") ||
    cat.includes("festival") ||
    cat.includes("กิจกรรม")
  )
    return CATEGORY_ICONS.event;

  // Beach
  if (cat.includes("beach") || cat.includes("ทะเล"))
    return CATEGORY_ICONS.beach;

  // Nature
  if (cat.includes("nature") || cat.includes("ธรรมชาติ"))
    return CATEGORY_ICONS.nature;

  // Island
  if (cat.includes("island") || cat.includes("เกาะ"))
    return CATEGORY_ICONS.island;

  // Heritage
  if (cat.includes("heritage") || cat.includes("มรดก"))
    return CATEGORY_ICONS.heritage;

  // Shopping
  if (cat.includes("shop") || cat.includes("shopping"))
    return CATEGORY_ICONS.shopping;

  // Market
  if (cat.includes("market") || cat.includes("ตลาด"))
    return CATEGORY_ICONS.market;

  // Attraction (default)
  return CATEGORY_ICONS.attraction;
}

function getCategoryLabel(item: MapItem): string {
  const cat = (item.category || item.type || "").toLowerCase();

  if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];

  // Fallback label mapping
  if (cat.includes("cafe") || cat.includes("coffee")) return "คาเฟ่";
  if (cat.includes("beach") || cat.includes("ทะเล")) return "ชายหาด";
  if (cat.includes("nature") || cat.includes("ธรรมชาติ")) return "ธรรมชาติ";
  if (cat.includes("island") || cat.includes("เกาะ")) return "เกาะ";
  if (cat.includes("heritage") || cat.includes("มรดก")) return "มรดก";
  if (cat.includes("shop") || cat.includes("shopping")) return "ช้อปปิ้ง";
  if (cat.includes("market") || cat.includes("ตลาด")) return "ตลาด";

  return item.category || item.type || "สถานที่";
}

// Internal component to handle view updates and zoom-based clustering
function MapController({
  items,
  onZoomChange,
}: {
  items: MapItem[];
  onZoomChange?: (zoom: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      if (onZoomChange) {
        onZoomChange(map.getZoom());
      }
    },
  });

  useEffect(() => {
    if (items.length > 0) {
      const points = items
        .map((i) => [Number(i.latitude), Number(i.longitude)] as [number, number])
        .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0);

      if (points.length > 0) {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [items, map]);

  useEffect(() => {
    if (onZoomChange) {
      onZoomChange(map.getZoom());
    }
  }, [map, onZoomChange]);

  return null;
}

// Controller to fly the map to a focused location
function MapFocusController({
  focusedLocation,
  markerRefs,
}: {
  focusedLocation?: { lat: number; lng: number; id?: string | number } | null;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();
  const [activeItemId, setActiveItemId] = useState<string | number | null>(null);

  useEffect(() => {
    if (focusedLocation) {
      const lat = Number(focusedLocation.lat);
      const lng = Number(focusedLocation.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        try {
            const currentCenter = map.getCenter();
            if (isNaN(currentCenter.lat) || isNaN(currentCenter.lng)) {
              // Map state is poisoned from a previous bad render, fallback to direct setView without math
              map.setView([lat, lng], 16);
            } else {
              map.flyTo([lat, lng], 16, {
                animate: true,
                duration: 1.5,
              });
            }
        } catch (err) {
            // Leaflet map might be fully broken if bounds computation failed previously
            map.setView([lat, lng], 16);
        }
      }
      if (focusedLocation.id) {
        setActiveItemId(focusedLocation.id);
      }
    }
  }, [focusedLocation, map]);

  useEffect(() => {
    if (activeItemId) {
      const marker = markerRefs.current[activeItemId];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [activeItemId, markerRefs]);

  return null;
}

// Simple clustering: group nearby markers at low zoom levels
function clusterMarkers(
  items: MapItem[],
  zoom: number,
  clusterDistance: number = 0.01,
): Array<
  | { type: "single"; item: MapItem }
  | { type: "cluster"; items: MapItem[]; lat: number; lng: number }
> {
  // At high zoom levels (>= 13), show all markers individually
  if (zoom >= 13) {
    return items.map((item) => ({ type: "single" as const, item }));
  }

  // At lower zoom levels, cluster nearby markers
  const clusters: Array<{
    type: "cluster";
    items: MapItem[];
    lat: number;
    lng: number;
  }> = [];
  const assigned = new Set<number>();

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) continue;

    const item = items[i];
    const clusterItems: MapItem[] = [item];
    assigned.add(i);

    for (let j = i + 1; j < items.length; j++) {
      if (assigned.has(j)) continue;
      const other = items[j];
      const latDiff = Math.abs(item.latitude - other.latitude);
      const lngDiff = Math.abs(item.longitude - other.longitude);
      if (latDiff < clusterDistance && lngDiff < clusterDistance) {
        clusterItems.push(other);
        assigned.add(j);
      }
    }

    if (clusterItems.length === 1) {
      // Will be handled as single marker
    } else {
      const avgLat =
        clusterItems.reduce((s, i) => s + i.latitude, 0) / clusterItems.length;
      const avgLng =
        clusterItems.reduce((s, i) => s + i.longitude, 0) / clusterItems.length;
      clusters.push({
        type: "cluster",
        items: clusterItems,
        lat: avgLat,
        lng: avgLng,
      });
    }
  }

  // Combine clusters with single items
  const result: Array<
    | { type: "single"; item: MapItem }
    | { type: "cluster"; items: MapItem[]; lat: number; lng: number }
  > = [];

  for (let i = 0; i < items.length; i++) {
    if (assigned.has(i)) {
      // Check if this item is part of a cluster
      const inCluster = clusters.find((c) =>
        c.items.some((item) => item === items[i]),
      );
      if (!inCluster) {
        result.push({ type: "single", item: items[i] });
      }
    }
  }

  // Add clusters
  for (const cluster of clusters) {
    result.push(cluster);
  }

  return result;
}

export default function TripMap({
  items,
  routeGeometries,
  center = [13.7563, 100.5018],
  zoom = 10,
  focusedLocation,
}: TripMapProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  // MEMOIZE: Filter valid items once, not every render
  const validItems = useMemo(
    () => items.filter((item) => {
        const lat = Number(item.latitude);
        const lng = Number(item.longitude);
        return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
    }),
    [items],
  );

  // MEMOIZE: Cluster markers based on zoom level
  const clusteredItems = useMemo(() => {
    return clusterMarkers(validItems, currentZoom);
  }, [validItems, currentZoom]);

  // MEMOIZE: Convert route coordinates once
  const routePolylines = useMemo(() => {
    if (!routeGeometries) return [];
    return routeGeometries.map((route) => {
      const color = DAY_COLORS[(route.day - 1) % DAY_COLORS.length];
      // GeoJSON coordinates are [lng, lat], Leaflet needs [lat, lng]
      const positions = route.coordinates
        .map(([lng, lat]) => [Number(lat), Number(lng)] as [number, number])
        .filter(([pLat, pLng]) => !isNaN(pLat) && !isNaN(pLng));
      return { day: route.day, color, positions };
    });
  }, [routeGeometries]);

  // MEMOIZE: Prepare marker data once (for single markers)
  const singleMarkerData = useMemo(
    () =>
      clusteredItems
        .filter((c) => c.type === "single")
        .map((c) => {
          const item = (c as { type: "single"; item: MapItem }).item;
          return {
            id: item.id || item.name,
            item,
            icon: getMarkerIcon(item),
            label: getCategoryLabel(item),
            safeImageUrl:
              typeof item.thumbnail_url === "string" &&
              isAllowedImageUrl(item.thumbnail_url)
                ? item.thumbnail_url
                : null,
          };
        }),
    [clusteredItems],
  );

  // MEMOIZE: Prepare cluster data
  const clusterData = useMemo(
    () =>
      clusteredItems
        .filter((c) => c.type === "cluster")
        .map((c) => {
          const cluster = c as {
            type: "cluster";
            items: MapItem[];
            lat: number;
            lng: number;
          };
          return {
            count: cluster.items.length,
            lat: cluster.lat,
            lng: cluster.lng,
            items: cluster.items,
          };
        }),
    [clusteredItems],
  );

  const handleZoomChange = useCallback((newZoom: number) => {
    setCurrentZoom(newZoom);
  }, []);

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

      <MapController items={validItems} onZoomChange={handleZoomChange} />
      <MapFocusController focusedLocation={focusedLocation} markerRefs={markerRefs} />

      {/* Route polylines - memoized */}
      {routePolylines.map((route) => (
        <Polyline
          key={`route-day-${route.day}`}
          positions={route.positions}
          pathOptions={{ color: route.color, weight: 4, opacity: 0.7 }}
        />
      ))}

      {/* Cluster markers (shown at low zoom) */}
      {clusterData.map((cluster, idx) => (
        <Marker
          key={`cluster-${idx}`}
          position={[cluster.lat, cluster.lng]}
          icon={createClusterIcon(cluster.count)}
        >
          <Popup>
            <div className="p-2">
              <p className="font-semibold text-sm mb-2">
                {cluster.count} locations
              </p>
              <div className="max-h-32 overflow-y-auto">
                {cluster.items.slice(0, 5).map((item, i) => (
                  <p key={i} className="text-xs text-gray-600">
                    {item.name}
                  </p>
                ))}
                {cluster.items.length > 5 && (
                  <p className="text-xs text-gray-400">
                    +{cluster.items.length - 5} more
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Zoom in to see individual markers
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Single markers (shown at high zoom or when not clustered) */}
      {singleMarkerData.map((marker) => (
        <Marker
          key={`${marker.id}-${marker.item.name}`}
          position={[marker.item.latitude, marker.item.longitude]}
          icon={marker.icon}
          ref={(r) => {
            if (marker.id) {
              markerRefs.current[marker.id] = r;
            }
          }}
        >
          <Popup className="min-w-50">
            <div className="flex flex-col gap-2">
              {marker.safeImageUrl && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100">
                  <Image
                    src={marker.safeImageUrl}
                    alt={marker.item.name_en || marker.item.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              )}
              <div>
                <h3 className="font-bold text-sm leading-tight line-clamp-2">
                  {marker.item.name}
                </h3>
                {marker.item.name_en && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {marker.item.name_en}
                  </p>
                )}
                {marker.item.address && (
                  <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                    {marker.item.address}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                {marker.item.rating && (
                  <>
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    {marker.item.rating}
                  </>
                )}
                <span className="text-muted-foreground font-normal ml-auto bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {marker.label}
                </span>
              </div>
              {marker.item.itemType === "hotel" &&
                marker.item.priceRange && (
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-xs font-bold text-emerald-600">
                      ฿{marker.item.priceRange}/night
                    </span>
                    {marker.item.bookingUrl && (
                      <a
                        href={marker.item.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded transition-colors"
                      >
                        Book
                      </a>
                    )}
                  </div>
                )}
              {(marker.item.itemType === "place" || marker.item.itemType === "event") && (() => {
                const detailId = marker.item.itemType === "event"
                  ? marker.item.event_id
                  : (marker.item.pg_place_id || marker.item.raw_id);
                const detailPath = marker.item.itemType === "event"
                  ? `/event/${detailId}`
                  : `/place/${detailId}`;
                if (!detailId) return null;
                return (
                  <div className="flex items-center justify-end pt-1 border-t">
                    <a
                        href={detailPath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-white hover:text-white bg-emerald-500 hover:bg-emerald-600 px-2 py-1 rounded transition-colors"
                      >
                        View Details
                      </a>
                  </div>
                );
              })()}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
