"use client";

import { useState, useMemo, useCallback, useEffect, memo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Star, MapPin, Loader2 } from "lucide-react";
import Image from "next/image";
import { useMapData, useMapSummary } from "@/hooks/api/useMapData";
import { useDebounce } from "@/hooks/useDebounce";
import { useIconCache } from "@/hooks/useIconCache";
import type { Province } from "@/lib/dtos/province.dto";
import type { MapBounds } from "@/lib/dtos/map.dto";

const CLUSTER_THRESHOLD = 10;

interface ExploreMapOptimizedProps {
  provinces: Province[];
  filters?: {
    provinceIds?: number[];
    categoryId?: number;
    minRating?: number;
    searchTerm?: string;
    type?: "all" | "place" | "event";
  };
  center?: [number, number];
  zoom?: number;
}

interface MapItemInternal {
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
  places: MapItemInternal[];
  events: MapItemInternal[];
  totalCount: number;
}

function MapBoundsHandler({
  onBoundsChange,
  onZoomChange,
}: {
  onBoundsChange: (bounds: MapBounds) => void;
  onZoomChange: (zoom: number) => void;
}) {
  const map = useMap();

  const updateBounds = useCallback(() => {
    try {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
      onZoomChange(map.getZoom());
    } catch {
      // Map not ready
    }
  }, [map, onBoundsChange, onZoomChange]);

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds,
    load: () => {
      updateBounds();
    },
  });

  useEffect(() => {
    const timer = setTimeout(updateBounds, 100);
    return () => clearTimeout(timer);
  }, [updateBounds]);

  return null;
}


const ProvinceClusterMarker = memo(function ProvinceClusterMarker({
  cluster,
  iconCache,
}: {
  cluster: ProvinceCluster & { _summaryPlacesCount?: number; _summaryEventsCount?: number };
  iconCache: ReturnType<typeof useIconCache>;
}) {
  const placesCount = cluster._summaryPlacesCount ?? cluster.places.length;
  const eventsCount = cluster._summaryEventsCount ?? cluster.events.length;

  const icon = iconCache.getProvinceIcon(
    cluster.province.id,
    placesCount,
    eventsCount,
    cluster.province.name_en || cluster.province.name
  );

  return (
    <Marker
      position={[cluster.province.latitude, cluster.province.longitude]}
      icon={icon}
    >
      <Popup className="province-popup">
        <div className="min-w-[220px] p-2">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-emerald-500" />
            <h3 className="font-bold text-base">
              {cluster.province.name_en || cluster.province.name}
            </h3>
          </div>

          {placesCount > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                {placesCount} Places
              </div>
              {cluster.places.length > 0 && (
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
              )}
            </div>
          )}

          {eventsCount > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                {eventsCount} Events
              </div>
              {cluster.events.length > 0 && (
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
              )}
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
  );
});

const IndividualMarker = memo(function IndividualMarker({
  item,
  iconCache,
}: {
  item: MapItemInternal;
  iconCache: ReturnType<typeof useIconCache>;
}) {
  const isPlace = item.type === "place";
  const icon = isPlace ? iconCache.getPlaceIcon() : iconCache.getEventIcon();

  return (
    <Marker position={[item.latitude, item.longitude]} icon={icon}>
      <Popup className="min-w-[200px]">
        <div className="flex flex-col gap-2">
          <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100">
            {item.thumbnail_url ? (
              <Image
                src={item.thumbnail_url}
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
                className={`text-[10px] text-white px-1.5 py-0.5 rounded ${
                  isPlace ? "bg-amber-500" : "bg-indigo-500"
                }`}
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
});

export default function ExploreMapOptimized({
  provinces,
  filters = {},
  center = [13.7563, 100.5018],
  zoom = 6,
}: ExploreMapOptimizedProps) {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapType, setMapType] = useState<"all" | "place" | "event">("all");
  const iconCache = useIconCache();

  const debouncedBounds = useDebounce(bounds, 150);

  const showClusters = currentZoom < CLUSTER_THRESHOLD;

  const combinedFilters = useMemo(
    () => ({
      ...filters,
      type: mapType,
    }),
    [filters, mapType]
  );

  const { items, isLoading: isMapLoading, placesCount, eventsCount } = useMapData(
    debouncedBounds,
    combinedFilters,
    isMapReady && !showClusters
  );

  const { summary, isLoading: isSummaryLoading } = useMapSummary(
    combinedFilters,
    isMapReady && showClusters
  );

  const isLoading = showClusters ? isSummaryLoading : isMapLoading;

  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  const handleZoomChange = useCallback((newZoom: number) => {
    setCurrentZoom(newZoom);
  }, []);

  const internalItems: MapItemInternal[] = useMemo(() => {
    if (showClusters) return [];
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      name_en: item.name_en,
      type: item.type as "place" | "event",
      latitude: item.latitude,
      longitude: item.longitude,
      province_id: item.province_id,
      thumbnail_url: item.thumbnail_url,
      rating: item.rating,
    }));
  }, [items, showClusters]);

  const { clusters, individualItems } = useMemo(() => {
    if (showClusters) {
      // Map summary data to clusters
      const provinceMap = new Map<number, Province>();
      provinces.forEach((p) => provinceMap.set(p.id, p));

      const clusterData: ProvinceCluster[] = [];
      summary.forEach((s) => {
        const province = provinceMap.get(s.province_id);
        if (!province) return;
        clusterData.push({
          province,
          places: [], // Empty array for summary mode
          events: [], // Empty array for summary mode
          totalCount: s.totalCount,
          _summaryPlacesCount: s.placesCount,
          _summaryEventsCount: s.eventsCount,
        } as ProvinceCluster & { _summaryPlacesCount: number; _summaryEventsCount: number });
      });

      return {
        clusters: clusterData.sort((a, b) => b.totalCount - a.totalCount),
        individualItems: [],
      };
    } else {
      // For zoomed-in view, we don't show clusters
      return {
        clusters: [],
        individualItems: internalItems.filter(
          (item) =>
            item.latitude &&
            item.longitude &&
            !isNaN(item.latitude) &&
            !isNaN(item.longitude)
        ),
      };
    }
  }, [internalItems, provinces, showClusters, summary]);

  const totalPlaces = showClusters
    ? summary.reduce((acc, curr) => acc + curr.placesCount, 0)
    : placesCount;
  const totalEvents = showClusters
    ? summary.reduce((acc, curr) => acc + curr.eventsCount, 0)
    : eventsCount;
  const viewCount = showClusters ? "Summary View" : `${items.length} in view`;

  return (
    <div className="relative w-full h-full">
      {/* Map Type Filter Control */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl shadow-lg z-[500] border border-gray-100 dark:border-slate-800 flex items-center gap-1">
        {(["all", "place", "event"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setMapType(type)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mapType === type
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
            {type === "all" && " Items"}
            {type === "place" && "s"}
            {type === "event" && "s"}
          </button>
        ))}
      </div>

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

        <MapBoundsHandler
          onBoundsChange={handleBoundsChange}
          onZoomChange={handleZoomChange}
        />

        <MapReadyHandler onReady={() => setIsMapReady(true)} />

        {showClusters
          ? clusters.map((cluster) => (
              <ProvinceClusterMarker
                key={`cluster-${cluster.province.id}`}
                cluster={cluster}
                iconCache={iconCache}
              />
            ))
          : individualItems.map((item) => (
              <IndividualMarker
                key={`${item.type}-${item.id}`}
                item={item}
                iconCache={iconCache}
              />
            ))}
      </MapContainer>

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Loading locations...
            </p>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg z-[500] border border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-bold text-gray-700 dark:text-slate-200">
            {isLoading ? "Loading..." : viewCount}
          </span>
        </div>
        {!isLoading && (totalPlaces > 0 || totalEvents > 0) && (
          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {totalPlaces} places
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {totalEvents} events
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MapReadyHandler({ onReady }: { onReady: () => void }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(onReady, 100);
    return () => clearTimeout(timer);
  }, [map, onReady]);

  return null;
}