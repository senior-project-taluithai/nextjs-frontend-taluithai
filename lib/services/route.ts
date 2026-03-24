import { RouteGeometry } from "@/components/my-trip/trip-map";

interface OsrmRouteResponse {
  code: string;
  routes: Array<{
    geometry: string;
    distance: number;
    duration: number;
    legs: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
}

interface Coordinate {
  latitude: number;
  longitude: number;
}

export const routeService = {
  getRoute: async (
    coordinates: Coordinate[],
  ): Promise<RouteGeometry | null> => {
    if (coordinates.length < 2) return null;

    const coordString = coordinates
      .map((c) => `${c.longitude},${c.latitude}`)
      .join(";");

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`,
    );

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data: OsrmRouteResponse = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    return {
      day: 0,
      coordinates: route.geometry as unknown as [number, number][],
    };
  },

  getDayRoute: async (
    hotel: Coordinate | null,
    places: Coordinate[],
    dayNumber: number,
  ): Promise<RouteGeometry | null> => {
    const coordinates: Coordinate[] = [];

    if (hotel) {
      coordinates.push(hotel);
    }

    coordinates.push(...places);

    if (hotel && places.length > 0) {
      coordinates.push(hotel);
    }

    if (coordinates.length < 2) return null;

    const route = await routeService.getRoute(coordinates);

    if (route) {
      route.day = dayNumber;
    }

    return route;
  },
};
