import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { UpdateUserPreferencesDto } from "@/lib/dtos/user.dto";

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
  });
};

export const useUpdateUserPreferencesMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserPreferencesDto) => authService.updateUserPreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
};
