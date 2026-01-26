import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoriteService } from "@/lib/favorite";

export const useFavoritePlaces = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ["favorites", "places", page, pageSize],
    queryFn: () => favoriteService.getFavoritePlaces(page, pageSize),
  });
};

export const useFavoriteEvents = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ["favorites", "events", page, pageSize],
    queryFn: () => favoriteService.getFavoriteEvents(page, pageSize),
  });
};

export const useToggleFavoritePlace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => favoriteService.toggleFavoritePlace(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["favorites", "places"] });
            // Ideally we'd also invalidate "places" query if it contained is_favorite status
        },
    });
};

export const useToggleFavoriteEvent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => favoriteService.toggleFavoriteEvent(id),
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ["favorites", "events"] });
             // Ideally we'd also invalidate "events" query if it contained is_favorite status
        },
    });
};
