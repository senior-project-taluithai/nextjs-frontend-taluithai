import { useQuery } from "@tanstack/react-query";
import { placeService } from "@/lib/services/place";

export const usePlaces = () => {
  return useQuery({
    queryKey: ["places"],
    queryFn: () => placeService.getAll(),
  });
};

export const usePlace = (id: number) => {
  return useQuery({
    queryKey: ["places", id],
    queryFn: () => placeService.getById(id),
    enabled: !!id,
  });
};

export const useRecommendedPlaces = () => {
  return useQuery({
    queryKey: ["places", "recommended"],
    queryFn: () => placeService.getRecommended(),
  });
};

export const usePopularPlaces = () => {
  return useQuery({
    queryKey: ["places", "popular"],
    queryFn: () => placeService.getPopular(),
  });
};

export const useBestForSeasonPlaces = () => {
  return useQuery({
    queryKey: ["places", "best-for-season"],
    queryFn: () => placeService.getBestForSeason(),
  });
};

export const useExplorePlaces = (query: import("@/lib/dtos/place.dto").ExplorePlacesQuery) => {
  return useQuery({
    queryKey: ["places", "explore", query],
    queryFn: () => placeService.explore(query),
  });
};
