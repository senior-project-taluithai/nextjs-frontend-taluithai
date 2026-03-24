import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hotelService, HotelDto } from "@/lib/services/hotel";
import { PaginatedResult } from "@/lib/dtos/pagination.dto";

export function useTripHotels(
  tripId: number,
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    minRating?: number;
    provinceIds?: number[];
  } = {},
) {
  return useQuery({
    queryKey: ["trips", tripId, "hotels", filters],
    queryFn: () => hotelService.getHotelsInTripProvinces(tripId, filters),
    enabled: !!tripId,
  });
}

export function useSetDayHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      dayNumber,
      data,
    }: {
      tripId: number;
      dayNumber: number;
      data: {
        hotelId: number;
        checkinTime?: string;
        checkoutTime?: string;
      };
    }) => hotelService.setDayHotel(tripId, dayNumber, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trips", variables.tripId] });
    },
  });
}

export function useRemoveDayHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      dayNumber,
    }: {
      tripId: number;
      dayNumber: number;
    }) => hotelService.removeDayHotel(tripId, dayNumber),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["trips", variables.tripId] });
    },
  });
}

export { hotelService };
