"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import Image from "next/image";
import type { Province } from "@/lib/dtos/province.dto";
import type { Place } from "@/lib/dtos/place.dto";
import type { Event } from "@/lib/dtos/event.dto";

type ItemInput = Place | Event;

interface MapItem {
  id: number;
  name: string;
  name_en: string;
  type: "place" | "event";
  latitude: number;
  longitude: number;
  province_id: number;
  thumbnail_url: string | null;
  rating: number;
}

interface ProvinceCluster {
  province: Province;
  places: MapItem[];
  events: MapItem[];
  totalCount: number;
}

function createProvinceClusterIcon(
  placesCount: number,
  eventsCount: number,
  provinceName: string,
): L.DivIcon {
  const total = placesCount + eventsCount;
  const placeColor = "#f59e0b";
  const eventColor = "#6366f1";

  const html = `
    <div style="
      min-width: 60px;
      background: white;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 8px 10px;
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
    ">
      <div style="
        font-size: 11px;
        font-weight: 700;
        color: #374151;
        text-align: center;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
      ">${provinceName}</div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${placesCount > 0 ? `
          <div style="display: flex; align-items: center; gap: 4px;">
            <div style="
              width: 10px;
              height: 10px;
              background: ${placeColor};
              border-radius: 50%;
              flex-shrink: 0;
            "></div>
            <span style="font-size: 10px; color: #6b7280;">${placesCount} places</span>
          </div>
        ` : ""}
        ${eventsCount > 0 ? `
          <div style="display: flex; align-items: center; gap: 4px;">
            <div style="
              width: 10px;
              height: 10px;
              background: ${eventColor};
              border-radius: 50%;
              flex-shrink: 0;
            "></div>
            <span style="font-size: 10px; color: #6b7280;">${eventsCount} events</span>
          </div>
        ` : ""}
      </div>
      <div style="
        position: absolute;
        top: -8px;
        right: -8px;
        background: #10b981;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">${total}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "province-cluster-icon",
    iconSize: [70, 60],
    iconAnchor: [35, 55],
    popupAnchor: [0, -55],
  });
}

function createPlaceIcon(): L.DivIcon {
  const html = `
    <div style="
      width: 36px;
      height: 44px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "place-marker-icon",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

function createEventIcon(): L.DivIcon {
  const html = `
    <div style="
      width: 36px;
      height: 44px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "event-marker-icon",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

const placeIcon = createPlaceIcon();
const eventIcon = createEventIcon();

interface ExploreMapProps {
  items: ItemInput[];
  provinces: Province[];
  center?: [number, number];
  zoom?: number;
}

function MapController({
  items,
  provinces,
  onZoomChange,
}: {
  items: ItemInput[];
  provinces: Province[];
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);

  useMapEvents({
    zoomend: () => {
      if (isMapReady) {
        try {
          onZoomChange(map.getZoom());
        } catch {
          // Ignore errors if map state is not ready
        }
      }
    },
    load: () => {
      setIsMapReady(true);
      try {
        onZoomChange(map.getZoom());
      } catch {
        // Ignore errors if map state is not ready
      }
    },
  });

  useEffect(() => {
    if (!isMapReady) return;
    if (items.length === 0) return;
    if (provinces.length === 0) return;

    try {
      const validItems = items.filter(
        (item) =>
          item.latitude &&
          item.longitude &&
          !isNaN(Number(item.latitude)) &&
          !isNaN(Number(item.longitude)),
      );

      if (validItems.length > 0) {
        const points = validItems.map(
          (item) => [Number(item.latitude), Number(item.longitude)] as [number, number],
        );
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12 });
        }
      }
    } catch {
      // Silently handle errors if map container is not ready
    }
  }, [items, provinces, map, isMapReady]);

  // Set ready state after initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMapReady(true);
      try {
        onZoomChange(map.getZoom());
      } catch {
        // Ignore if map not ready
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [map, onZoomChange]);

  return null;
}

function clusterByProvince(
  items: ItemInput[],
  provinces: Province[],
  zoom: number,
): {
  provinceClusters: ProvinceCluster[];
  individualItems: MapItem[];
  showClusters: boolean;
} {
  const validItems = items.filter(
    (item) =>
      item.latitude &&
      item.longitude &&
      !isNaN(Number(item.latitude)) &&
      !isNaN(Number(item.longitude)),
  );

  const CLUSTER_THRESHOLD = 10;

  if (zoom >= CLUSTER_THRESHOLD) {
    return {
      provinceClusters: [],
      individualItems: validItems.map((item) => ({
        id: item.id,
        name: item.name,
        name_en: item.name_en || item.name,
        type: "start_date" in item && item.start_date ? "event" : "place",
        latitude: Number(item.latitude),
        longitude: Number(item.longitude),
        province_id: item.province_id,
        thumbnail_url: item.thumbnail_url || null,
        rating: "user_rating_count" in item && item.user_rating_count > 0 ? item.user_rating : item.rating || 0,
      })),
      showClusters: false,
    };
  }

  const provinceMap = new Map<number, Province>();
  provinces.forEach((p) => {
    provinceMap.set(p.id, p);
  });

  const provinceGroups = new Map<number, { places: MapItem[]; events: MapItem[] }>();

  validItems.forEach((item) => {
    const provinceId = item.province_id;
    if (!provinceId) return;

    const mapItem: MapItem = {
      id: item.id,
      name: item.name,
      name_en: item.name_en || item.name,
      type: "start_date" in item && item.start_date ? "event" : "place",
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      province_id: provinceId,
      thumbnail_url: item.thumbnail_url || null,
      rating: "user_rating_count" in item && item.user_rating_count > 0 ? item.user_rating : item.rating || 0,
    };

    if (!provinceGroups.has(provinceId)) {
      provinceGroups.set(provinceId, { places: [], events: [] });
    }

    const group = provinceGroups.get(provinceId)!;
    if (mapItem.type === "place") {
      group.places.push(mapItem);
    } else {
      group.events.push(mapItem);
    }
  });

  const provinceClusters: ProvinceCluster[] = [];

  provinceGroups.forEach((group, provinceId) => {
    const province = provinceMap.get(provinceId);
    if (!province) return;

    const totalCount = group.places.length + group.events.length;

    provinceClusters.push({
      province,
      places: group.places,
      events: group.events,
      totalCount,
    });
  });

  provinceClusters.sort((a, b) => b.totalCount - a.totalCount);

  return {
    provinceClusters,
    individualItems: [],
    showClusters: true,
  };
}

export default function ExploreMap({
  items,
  provinces,
  center = [13.7563, 100.5018],
  zoom = 6,
}: ExploreMapProps) {
  const [currentZoom, setCurrentZoom] = useState(zoom);

  const handleZoomChange = useCallback((newZoom: number) => {
    setCurrentZoom(newZoom);
  }, []);

  const { provinceClusters, individualItems, showClusters } = useMemo(() => {
    return clusterByProvince(items, provinces, currentZoom);
  }, [items, provinces, currentZoom]);

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
        maxZoom={19}
        minZoom={4}
      />

      <MapController
        items={items}
        provinces={provinces}
        onZoomChange={handleZoomChange}
      />

      {showClusters
        ? provinceClusters.map((cluster) => (
            <Marker
              key={`province-${cluster.province.id}`}
              position={[cluster.province.latitude, cluster.province.longitude]}
              icon={createProvinceClusterIcon(
                cluster.places.length,
                cluster.events.length,
                cluster.province.name_en || cluster.province.name,
              )}
            >
              <Popup className="province-popup">
                <div className="min-w-[220px] p-2">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-base">
                      {cluster.province.name_en || cluster.province.name}
                    </h3>
                  </div>

                  {cluster.places.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        {cluster.places.length} Places
                      </div>
                      <div className="ml-3.5 mt-1 max-h-24 overflow-y-auto">
                        {cluster.places.slice(0, 5).map((place) => (
                          <Link
                            key={place.id}
                            href={`/place/${place.id}`}
                            className="block text-xs text-gray-600 hover:text-emerald-600 py-0.5 truncate"
                          >
                            {place.name_en || place.name}
                          </Link>
                        ))}
                        {cluster.places.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{cluster.places.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {cluster.events.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        {cluster.events.length} Events
                      </div>
                      <div className="ml-3.5 mt-1 max-h-24 overflow-y-auto">
                        {cluster.events.slice(0, 5).map((event) => (
                          <Link
                            key={event.id}
                            href={`/event/${event.id}`}
                            className="block text-xs text-gray-600 hover:text-emerald-600 py-0.5 truncate"
                          >
                            {event.name_en || event.name}
                          </Link>
                        ))}
                        {cluster.events.length > 5 && (
                          <span className="text-xs text-gray-400">
                            +{cluster.events.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <p className="text-[10px] text-gray-400 italic">
                      Zoom in to see individual markers
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))
        : individualItems.map((item) => {
            const isPlace = item.type === "place";
            const icon = isPlace ? placeIcon : eventIcon;
            const imageUrl = item.thumbnail_url;

            return (
              <Marker
                key={`${item.type}-${item.id}`}
                position={[item.latitude, item.longitude]}
                icon={icon}
              >
                <Popup className="min-w-[200px]">
                  <div className="flex flex-col gap-2">
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.name_en}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight line-clamp-2">
                        {item.name_en || item.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-[10px] text-white px-1.5 py-0.5 rounded ${isPlace ? "bg-amber-500" : "bg-indigo-500"}`}
                        >
                          {isPlace ? "Place" : "Event"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {item.rating ? item.rating.toFixed(1) : "N/A"}
                    </div>
                    <Link
                      href={`/${item.type}/${item.id}`}
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