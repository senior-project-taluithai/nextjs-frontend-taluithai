import { useQuery } from "@tanstack/react-query";
import { authService } from "@/lib/services/auth";
import { UserProfile } from "@/lib/dtos/user.dto";

export const useUserProfile = () => {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => authService.getProfile(),
    retry: false, // Don't retry if 401/403
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};
