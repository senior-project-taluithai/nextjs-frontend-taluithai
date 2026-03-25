import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef } from "react";
import { placeService } from "@/lib/services/place";
import { eventService } from "@/lib/services/event";
import type { MapBounds, MapQueryParams, MapItem, MapItemBase, MapSummaryItem } from "@/lib/dtos/map.dto";

const MAP_ENDPOINT_AVAILABLE_KEY = "map-endpoint-available";

function checkMapEndpointAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const stored = sessionStorage.getItem(MAP_ENDPOINT_AVAILABLE_KEY);
  if (stored === null) return true;
  return stored === "true";
}

function setMapEndpointAvailable(available: boolean): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(MAP_ENDPOINT_AVAILABLE_KEY, String(available));
}

function filterByBounds<T extends { latitude: number; longitude: number }>(
  items: T[],
  bounds: MapBounds
): T[] {
  return items.filter((item) => {
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    return (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= bounds.south &&
      lat <= bounds.north &&
      lng >= bounds.west &&
      lng <= bounds.east
    );
  });
}

interface MapQueryResult {
  data: { places: MapItem[]; totalCount: number } | null;
  isLoading: boolean;
  isError: boolean;
  isFallback: boolean;
}

interface EventsMapQueryResult {
  data: { events: MapItem[]; totalCount: number } | null;
  isLoading: boolean;
  isError: boolean;
  isFallback: boolean;
}

export function useMapPlaces(
  bounds: MapBounds | null,
  filters: {
    provinceIds?: number[];
    categoryId?: number;
    minRating?: number;
    searchTerm?: string;
    type?: "all" | "place" | "event";
  },
  enabled: boolean
): MapQueryResult {
  const endpointAvailable = useRef(checkMapEndpointAvailable());
  
  const shouldFetch = enabled && (!filters.type || filters.type === "all" || filters.type === "place");

  const mapQuery = useQuery({
    queryKey: ["places", "map", bounds, filters],
    queryFn: async () => {
      if (!bounds) return { places: [], totalCount: 0 };
      const params: MapQueryParams = {
        ...bounds,
        zoom: 10,
        ...filters,
      };
      return placeService.getMapPlaces(params);
    },
    enabled: shouldFetch && !!bounds && endpointAvailable.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const fallbackQuery = useQuery({
    queryKey: [
      "places",
      "explore-all",
      filters.searchTerm,
      filters.provinceIds,
      filters.categoryId,
      filters.minRating,
    ],
    queryFn: async () => {
      const result = await placeService.explore({
        searchTerm: filters.searchTerm,
        provinces: filters.provinceIds,
        categoryId: filters.categoryId,
        minRating: filters.minRating,
        limit: 2000,
        page: 1,
      });
      return result;
    },
    enabled: shouldFetch && !endpointAvailable.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!shouldFetch) {
    return {
      data: { places: [], totalCount: 0 },
      isLoading: false,
      isError: false,
      isFallback: false,
    };
  }

  if (mapQuery.isSuccess && mapQuery.data) {
    if (!endpointAvailable.current) {
      endpointAvailable.current = true;
      setMapEndpointAvailable(true);
    }
    const data = mapQuery.data as unknown as { places: MapItemBase[]; totalCount: number };
    return {
      data: {
        places: (data.places || []).map((p) => ({ ...p, type: "place" as const })),
        totalCount: data.totalCount || data.places?.length || 0,
      },
      isLoading: false,
      isError: false,
      isFallback: false,
    };
  }

  if (mapQuery.isError || !endpointAvailable.current) {
    if (mapQuery.isError && endpointAvailable.current) {
      endpointAvailable.current = false;
      setMapEndpointAvailable(false);
    }

    if (fallbackQuery.isSuccess && fallbackQuery.data) {
      const data = fallbackQuery.data as unknown as { data: any[]; total: number };
      const allPlaces = data.data || [];
      const filteredPlaces = bounds ? filterByBounds(allPlaces, bounds) : allPlaces;
      return {
        data: {
          places: filteredPlaces.map((p: any) => ({
            id: p.id,
            name: p.name,
            name_en: p.name_en,
            type: "place" as const,
            latitude: p.latitude,
            longitude: p.longitude,
            province_id: p.province_id,
            thumbnail_url: p.thumbnail_url,
            rating: p.user_rating_count > 0 ? p.user_rating : p.rating || 0,
          })),
          totalCount: Number(data.total) || filteredPlaces.length,
        },
        isLoading: false,
        isError: false,
        isFallback: true,
      };
    }

    return {
      data: null,
      isLoading: fallbackQuery.isLoading,
      isError: mapQuery.isError && fallbackQuery.isError,
      isFallback: false,
    };
  }

  return {
    data: null,
    isLoading: mapQuery.isLoading,
    isError: false,
    isFallback: false,
  };
}

export function useMapEvents(
  bounds: MapBounds | null,
  filters: {
    provinceIds?: number[];
    categoryId?: number;
    minRating?: number;
    searchTerm?: string;
    type?: "all" | "place" | "event";
  },
  enabled: boolean
): EventsMapQueryResult {
  const endpointAvailable = useRef(checkMapEndpointAvailable());

  const shouldFetch = enabled && (!filters.type || filters.type === "all" || filters.type === "event");

  const mapQuery = useQuery({
    queryKey: ["events", "map", bounds, filters],
    queryFn: async () => {
      if (!bounds) return { events: [], totalCount: 0 };
      const params: MapQueryParams = {
        ...bounds,
        zoom: 10,
        ...filters,
      };
      return eventService.getMapEvents(params);
    },
    enabled: shouldFetch && !!bounds && endpointAvailable.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const fallbackQuery = useQuery({
    queryKey: [
      "events",
      "explore-all",
      filters.searchTerm,
      filters.provinceIds,
      filters.categoryId,
      filters.minRating,
    ],
    queryFn: async () => {
      const result = await eventService.explore({
        searchTerm: filters.searchTerm,
        provinces: filters.provinceIds,
        categoryId: filters.categoryId,
        minRating: filters.minRating,
        limit: 2000,
        page: 1,
      });
      return result;
    },
    enabled: shouldFetch && !endpointAvailable.current,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (!shouldFetch) {
    return {
      data: { events: [], totalCount: 0 },
      isLoading: false,
      isError: false,
      isFallback: false,
    };
  }

  if (mapQuery.isSuccess && mapQuery.data) {
    if (!endpointAvailable.current) {
      endpointAvailable.current = true;
      setMapEndpointAvailable(true);
    }
    const data = mapQuery.data as unknown as { events: MapItemBase[]; totalCount: number };
    return {
      data: {
        events: (data.events || []).map((e) => ({ ...e, type: "event" as const })),
        totalCount: data.totalCount || data.events?.length || 0,
      },
      isLoading: false,
      isError: false,
      isFallback: false,
    };
  }

  if (mapQuery.isError || !endpointAvailable.current) {
    if (mapQuery.isError && endpointAvailable.current) {
      endpointAvailable.current = false;
      setMapEndpointAvailable(false);
    }

    if (fallbackQuery.isSuccess && fallbackQuery.data) {
      const data = fallbackQuery.data as unknown as { data: any[]; total: number };
      const allEvents = data.data || [];
      const filteredEvents = bounds ? filterByBounds(allEvents, bounds) : allEvents;
      return {
        data: {
          events: filteredEvents.map((e: any) => ({
            id: e.id,
            name: e.name,
            name_en: e.name_en,
            type: "event" as const,
            latitude: e.latitude,
            longitude: e.longitude,
            province_id: e.province_id,
            thumbnail_url: e.thumbnail_url,
            rating: e.rating || 0,
          })),
          totalCount: Number(data.total) || filteredEvents.length,
        },
        isLoading: false,
        isError: false,
        isFallback: true,
      };
    }

    return {
      data: null,
      isLoading: fallbackQuery.isLoading,
      isError: mapQuery.isError && fallbackQuery.isError,
      isFallback: false,
    };
  }

  return {
    data: null,
    isLoading: mapQuery.isLoading,
    isError: false,
    isFallback: false,
  };
}

export function useMapSummary(
  filters: {
    provinceIds?: number[];
    categoryId?: number;
    minRating?: number;
    searchTerm?: string;
    type?: "all" | "place" | "event";
  },
  enabled: boolean = true
) {
  const shouldFetchPlaces = enabled && (!filters.type || filters.type === "all" || filters.type === "place");
  const shouldFetchEvents = enabled && (!filters.type || filters.type === "all" || filters.type === "event");

  const placesQuery = useQuery({
    queryKey: ["places", "map", "summary", filters],
    queryFn: () => placeService.getMapSummary(filters),
    enabled: shouldFetchPlaces,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const eventsQuery = useQuery({
    queryKey: ["events", "map", "summary", filters],
    queryFn: () => eventService.getMapSummary(filters),
    enabled: shouldFetchEvents,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const summary = useMemo(() => {
    const places = placesQuery.data?.provinces || [];
    const events = eventsQuery.data?.provinces || [];

    const combined: Record<number, { province_id: number; placesCount: number; eventsCount: number; totalCount: number }> = {};

    places.forEach((p) => {
      if (!combined[p.province_id]) {
        combined[p.province_id] = { province_id: p.province_id, placesCount: 0, eventsCount: 0, totalCount: 0 };
      }
      combined[p.province_id].placesCount += p.count;
      combined[p.province_id].totalCount += p.count;
    });

    events.forEach((e) => {
      if (!combined[e.province_id]) {
        combined[e.province_id] = { province_id: e.province_id, placesCount: 0, eventsCount: 0, totalCount: 0 };
      }
      combined[e.province_id].eventsCount += e.count;
      combined[e.province_id].totalCount += e.count;
    });

    return Object.values(combined);
  }, [placesQuery.data, eventsQuery.data]);

  return {
    summary,
    isLoading: placesQuery.isLoading || eventsQuery.isLoading,
    isError: placesQuery.isError || eventsQuery.isError,
  };
}

export function useMapData(
  bounds: MapBounds | null,
  filters: {
    provinceIds?: number[];
    categoryId?: number;
    minRating?: number;
    searchTerm?: string;
    type?: "all" | "place" | "event";
  },
  enabled: boolean = true
) {
  const placesQuery = useMapPlaces(bounds, filters, enabled);
  const eventsQuery = useMapEvents(bounds, filters, enabled);

  const items: MapItem[] = useMemo(() => {
    const places = placesQuery.data?.places || [];
    const events = eventsQuery.data?.events || [];
    return [...places, ...events];
  }, [placesQuery.data, eventsQuery.data]);

  const placesCount = placesQuery.data?.totalCount || 0;
  const eventsCount = eventsQuery.data?.totalCount || 0;

  return {
    items,
    totalCount: placesCount + eventsCount,
    isLoading: placesQuery.isLoading || eventsQuery.isLoading,
    isError: placesQuery.isError && eventsQuery.isError,
    placesCount,
    eventsCount,
    isFallback: placesQuery.isFallback || eventsQuery.isFallback,
  };
}