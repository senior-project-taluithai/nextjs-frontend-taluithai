import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoriteService } from "@/lib/services/favorite";
import { interactionService } from "@/lib/services/interaction";
import { useAuth } from "@/components/providers/AuthProvider";

export const useFavoritePlaces = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ["favorites", "places", page, pageSize],
    queryFn: () => favoriteService.getFavoritePlaces(page, pageSize),
    staleTime: 2 * 60 * 1000,
  });
};

export const useFavoriteEvents = (page: number = 1, pageSize: number = 10) => {
  return useQuery({
    queryKey: ["favorites", "events", page, pageSize],
    queryFn: () => favoriteService.getFavoriteEvents(page, pageSize),
    staleTime: 2 * 60 * 1000,
  });
};

import { toast } from "sonner";

export const useToggleFavoritePlace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => favoriteService.toggleFavoritePlace(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["favorites", "isSaved", "place", id],
      });
      const previousIsSaved = queryClient.getQueryData<boolean>([
        "favorites",
        "isSaved",
        "place",
        id,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData(
        ["favorites", "isSaved", "place", id],
        (old: boolean | undefined) => !old,
      );

      return { previousIsSaved };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(
        ["favorites", "isSaved", "place", id],
        context?.previousIsSaved,
      );
      toast.error("Failed to update favorites");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", "places"] });
      queryClient.invalidateQueries({
        queryKey: ["favorites", "isSaved", "place", variables],
      });

      // We can check the new state from cache to decide toast message,
      // but simpler is to just generic success or infer from optimistic state?
      // Actually API toggle doesn't return state.
      // We can assume if we were successful, the action checks out.
      // Let's use a generic success or try to guess.
      // Since we toggled, we can say "Updated favorites".
      // A better UX might be knowing if it was added or removed.
      // But we only know !previousIsSaved.
      const isSaved = queryClient.getQueryData([
        "favorites",
        "isSaved",
        "place",
        variables,
      ]);
      if (isSaved)
        interactionService.track({
          place_id: variables,
          interaction_type: "save",
        });
      toast.success(isSaved ? "Added to favorites" : "Removed from favorites");
    },
  });
};

export const useToggleFavoriteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => favoriteService.toggleFavoriteEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ["favorites", "isSaved", "event", id],
      });
      const previousIsSaved = queryClient.getQueryData<boolean>([
        "favorites",
        "isSaved",
        "event",
        id,
      ]);

      queryClient.setQueryData(
        ["favorites", "isSaved", "event", id],
        (old: boolean | undefined) => !old,
      );

      return { previousIsSaved };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(
        ["favorites", "isSaved", "event", id],
        context?.previousIsSaved,
      );
      toast.error("Failed to update favorites");
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["favorites", "events"] });
      queryClient.invalidateQueries({
        queryKey: ["favorites", "isSaved", "event", variables],
      });

      const isSaved = queryClient.getQueryData([
        "favorites",
        "isSaved",
        "event",
        variables,
      ]);
      if (isSaved)
        interactionService.track({
          event_id: variables,
          interaction_type: "save",
        });
      toast.success(
        isSaved ? "Event saved to calendar" : "Event removed from calendar",
      );
    },
  });
};

export const useIsFavoritePlace = (id: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", "isSaved", "place", id],
    queryFn: () => favoriteService.checkFavoritePlace(id),
    enabled: !!id && !!user,
    staleTime: 5 * 60 * 1000,
  });
};

export const useIsFavoriteEvent = (id: number) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", "isSaved", "event", id],
    queryFn: () => favoriteService.checkFavoriteEvent(id),
    enabled: !!id && !!user,
    staleTime: 5 * 60 * 1000,
  });
};
