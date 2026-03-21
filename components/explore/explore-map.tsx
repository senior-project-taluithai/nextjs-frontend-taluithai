"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

// Leaflet Icon Fix for Next.js - Using colored markers
const createIcon = (color: "blue" | "red") => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const placeIcon = createIcon("red");
const eventIcon = createIcon("blue");

interface ExploreMapProps {
  items: any[]; // Using any to be flexible with mixed types, or can be strict union
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

export default function ExploreMap({
  items,
  center = [13.7563, 100.5018],
  zoom = 6,
}: ExploreMapProps) {
  const validItems = items.filter(
    (item: any) => item.latitude && item.longitude,
  );

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
        const isPlace = !("start_date" in item); // Simple heuristic
        const id = item.id;
        const type = isPlace ? "place" : "event";
        const imageUrl = item.thumbnail_url || item.thumbnailUrl;
        const icon = isPlace ? placeIcon : eventIcon;
        const name = item.name_en || item.nameEn;
        const localName = item.name;
        const displayRating =
          isPlace && item.user_rating_count > 0
            ? item.user_rating
            : item.rating || 0;

        return (
          <Marker
            key={`${type}-${id}`}
            position={[item.latitude, item.longitude]}
            icon={icon}
          >
            <Popup className="min-w-[200px]">
              <div className="flex flex-col gap-2">
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-100">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={name}
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
                    {name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {localName}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 capitalize border px-1 rounded w-fit">
                    {type}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-yellow-600">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  {displayRating}
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
