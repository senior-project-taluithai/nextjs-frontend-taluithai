import { useQuery } from "@tanstack/react-query";
import { routeService } from "@/lib/services/route";
import { RouteGeometry } from "@/components/my-trip/trip-map";

interface Coordinate {
  latitude: number;
  longitude: number;
}

export function useDayRoute(
  hotel: Coordinate | null,
  places: Coordinate[],
  dayNumber: number,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: ["route", dayNumber, hotel, places],
    queryFn: async (): Promise<RouteGeometry | null> => {
      return routeService.getDayRoute(hotel, places, dayNumber);
    },
    enabled: enabled && places.length > 0,
    staleTime: 1000 * 60 * 60, // Cache routes for 1 hour
  });
}
