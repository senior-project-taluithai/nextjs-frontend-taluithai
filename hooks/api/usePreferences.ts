import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import {
  UpdateUserPreferencesDto,
  UpdateRecommendationPreferencesDto,
} from "@/lib/dtos/user.dto";

export const useAllTravelPreferences = () => {
  return useQuery({
    queryKey: ["travel-preferences"],
    queryFn: () => authService.getAllTravelPreferences(),
    staleTime: Infinity, // These rarely change
  });
};

export const useUserPreferences = () => {
  return useQuery({
    queryKey: ["user-preferences"],
    queryFn: () => authService.getUserPreferences(),
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const useUpdateUserPreferencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserPreferencesDto) =>
      authService.updateUserPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
};

export const useRecommendationPreferences = () => {
  return useQuery({
    queryKey: ["recommendation-preferences"],
    queryFn: () => authService.getRecommendationPreferences(),
    staleTime: 0,
    refetchOnMount: "always",
  });
};

export const useUpdateRecommendationPreferencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRecommendationPreferencesDto) =>
      authService.updateRecommendationPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recommendation-preferences"],
      });
      queryClient.invalidateQueries({ queryKey: ["places", "recommended"] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
};
