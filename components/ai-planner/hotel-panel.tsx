"use client";

import { useState } from "react";
import {
  Star,
  MapPin,
  ExternalLink,
  Hotel,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Wifi,
  Waves,
  Car,
  Coffee,
  Dumbbell,
  Wind,
  Utensils,
  Shield,
  Wine,
} from "lucide-react";
import type { HotelData, HotelItem } from "@/hooks/useAgentChat";
import { api } from "@/lib/api-client";

interface HotelPanelProps {
  data?: HotelData | null;
}

async function getFullBookingUrl(
  hotelName: string,
  location?: string,
): Promise<string | null> {
  try {
    const params = new URLSearchParams({ name: hotelName });
    if (location) params.append("location", location);
    const response = await api.get(`/hotels/lookup?${params.toString()}`);
    return response.data.bookingUrl || null;
  } catch {
    return null;
  }
}

const amenityIcons: Record<string, React.ReactNode> = {
  "Free Wi-Fi": <Wifi className="w-3 h-3" />,
  "Wi-Fi": <Wifi className="w-3 h-3" />,
  Pool: <Waves className="w-3 h-3" />,
  Parking: <Car className="w-3 h-3" />,
  "Free Parking": <Car className="w-3 h-3" />,
  Breakfast: <Coffee className="w-3 h-3" />,
  Restaurant: <Utensils className="w-3 h-3" />,
  "Fitness Center": <Dumbbell className="w-3 h-3" />,
  Gym: <Dumbbell className="w-3 h-3" />,
  Spa: <Wind className="w-3 h-3" />,
  "Air Conditioning": <Wind className="w-3 h-3" />,
  "Bar/Lounge": <Wine className="w-3 h-3" />,
  Safe: <Shield className="w-3 h-3" />,
};

function HotelImageCarousel({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [current, setCurrent] = useState(0);
  const validImages = images.filter((url) => url && url.startsWith("http"));

  if (validImages.length === 0) {
    return (
      <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-50 rounded-t-2xl flex items-center justify-center">
        <Hotel className="w-10 h-10 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-44 rounded-t-2xl overflow-hidden bg-gray-100">
      <img
        src={validImages[current]}
        alt={name}
        className="w-full h-full object-cover transition-opacity duration-300"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      {validImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === 0 ? validImages.length - 1 : p - 1));
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCurrent((p) => (p === validImages.length - 1 ? 0 : p + 1));
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {validImages.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === current ? "w-4 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
            {validImages.length > 5 && (
              <span className="text-[9px] text-white/70 ml-1 self-center">
                +{validImages.length - 5}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("th-TH").format(Math.round(price));
}

function AmenityBadge({ amenity }: { amenity: string }) {
  const icon = amenityIcons[amenity];
  const bgColor =
    amenity.includes("Pool") || amenity.includes("Beach")
      ? "bg-blue-50 text-blue-600 border-blue-100"
      : amenity.includes("WiFi") || amenity.includes("Internet")
        ? "bg-purple-50 text-purple-600 border-purple-100"
        : amenity.includes("Parking")
          ? "bg-green-50 text-green-600 border-green-100"
          : amenity.includes("Breakfast") || amenity.includes("Restaurant")
            ? "bg-amber-50 text-amber-600 border-amber-100"
            : amenity.includes("Gym") || amenity.includes("Fitness")
              ? "bg-red-50 text-red-600 border-red-100"
              : amenity.includes("Spa")
                ? "bg-pink-50 text-pink-600 border-pink-100"
                : "bg-gray-50 text-gray-600 border-gray-100";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${bgColor}`}
    >
      {icon}
      <span>{amenity}</span>
    </span>
  );
}

function HotelCard({ hotel }: { hotel: HotelItem }) {
  const [isLoadingUrl, setIsLoadingUrl] = useState<string | null>(null);
  const allImages = [
    ...(hotel.imageUrls || []),
    ...(hotel.thumbnail ? [hotel.thumbnail] : []),
  ].filter((url, idx, arr) => arr.indexOf(url) === idx);

  const hasPrices = hotel.prices && hotel.prices.length > 0;
  const hasAmenities = hotel.amenities && hotel.amenities.length > 0;
  const displayAmenities = hasAmenities ? hotel.amenities!.slice(0, 6) : [];
  const extraAmenitiesCount = hasAmenities
    ? Math.max(0, hotel.amenities!.length - 6)
    : 0;

  const isShortUrl = (url: string) => url.startsWith("/hotel-");

  const handleBookClick = async (e: React.MouseEvent, url: string) => {
    e.preventDefault();
    if (isShortUrl(url)) {
      setIsLoadingUrl(url);
      const fullUrl = await getFullBookingUrl(hotel.name);
      setIsLoadingUrl(null);
      if (fullUrl) {
        window.open(fullUrl, "_blank", "noopener,noreferrer");
      }
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <HotelImageCarousel images={allImages} name={hotel.name} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
              {hotel.name}
            </h4>
            {hotel.address && (
              <div className="flex items-start gap-1 mt-1">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 line-clamp-1">
                  {hotel.address}
                </p>
              </div>
            )}
          </div>
          {hotel.rating > 0 && (
            <div className="flex items-center gap-1 shrink-0 bg-amber-50 px-2 py-1 rounded-lg">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-amber-700">
                {hotel.rating.toFixed(1)}
              </span>
              {hotel.reviewCount > 0 && (
                <span className="text-[10px] text-amber-600/70">
                  ({hotel.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>

        {hotel.priceRange && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <span>฿</span>
              <span>{hotel.priceRange}</span>
              <span className="text-emerald-600/70 font-normal">/ night</span>
            </span>
          </div>
        )}

        {hasAmenities && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {displayAmenities.map((amenity, idx) => (
                <AmenityBadge key={idx} amenity={amenity} />
              ))}
              {extraAmenitiesCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-500">
                  +{extraAmenitiesCount} more
                </span>
              )}
            </div>
          </div>
        )}

        {hasPrices && (
          <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
            <div className="bg-gray-50/80 px-3 py-2 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                Compare Prices
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {hotel.prices.map((price, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50/50 transition-colors"
                >
                  <span className="text-xs text-gray-700 truncate flex-1 mr-3 font-medium">
                    {price.provider}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900">
                      ฿{formatPrice(price.price)}
                    </span>
                    {price.link && (
                      <button
                        onClick={(e) => handleBookClick(e, price.link!)}
                        disabled={isLoadingUrl === price.link}
                        className="text-[10px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {isLoadingUrl === price.link ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            Book
                            <ExternalLink className="w-2.5 h-2.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasPrices && hotel.bookingUrl && (
          <button
            onClick={(e) => handleBookClick(e, hotel.bookingUrl!)}
            disabled={isLoadingUrl === hotel.bookingUrl}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 mb-3"
          >
            {isLoadingUrl === hotel.bookingUrl ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Book Now
                <ExternalLink className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}

        {hotel.website &&
          !hotel.website.includes("/url?sa=") &&
          !isShortUrl(hotel.website) && (
            <a
              href={hotel.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 hover:text-emerald-600 transition-colors py-1"
            >
              Visit website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
      </div>
    </div>
  );
}

export function HotelPanel({ data }: HotelPanelProps) {
  if (!data || data.hotels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-dashed border-gray-200 mt-4 mx-3">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <Hotel className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-600 mb-1">
          No hotels found yet.
        </p>
        <p className="text-xs text-gray-400">
          Hotels will appear after trip planning.
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-4 space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Hotel className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">
              {data.hotels.length} hotel{data.hotels.length !== 1 ? "s" : ""}{" "}
              found
            </p>
            <p className="text-[10px] text-gray-400">
              Best prices from top providers
            </p>
          </div>
        </div>
      </div>
      <div className="grid gap-4">
        {data.hotels.map((hotel, idx) => (
          <HotelCard key={`${hotel.name}-${idx}`} hotel={hotel} />
        ))}
      </div>
    </div>
  );
}
