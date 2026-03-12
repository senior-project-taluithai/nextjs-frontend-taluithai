import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export const useHiddenGems = () => {
  return useQuery({
    queryKey: ["places", "hidden-gems"],
    queryFn: () => placeService.getHiddenGems(),
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

export const useAddPlaceReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment, rating }: { id: number; comment: string; rating: number }) => placeService.addReview(id, comment, rating),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["places", variables.id] });
    },
  });
};

export const useTiktokVideos = (placeId: number) => {
  return useQuery({
    queryKey: ["places", placeId, "tiktok-videos"],
    queryFn: () => placeService.getTiktokVideos(placeId),
    enabled: !!placeId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
