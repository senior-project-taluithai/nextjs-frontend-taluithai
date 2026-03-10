import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripService, tripExtendedService } from '@/lib/services/trip';
import { 
    UpdateTripRequest, 
    CreateTripDayItemRequest, 
    UpdateTripDayItemRequest, 
    ReorderItemsRequest 
} from '@/lib/dtos/trip.dto';

// React Query hooks
export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: tripService.getAll,
  });
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => tripService.getById(id),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tripService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTripRequest }) =>
      tripService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', variables.id] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tripService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// Recommendation hooks
export function useTripRecommendedPlaces(tripId: number, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['trips', tripId, 'recommendations', 'places', page, limit],
    queryFn: () => tripExtendedService.getRecommendedPlaces(tripId, page, limit),
    enabled: !!tripId,
  });
}

export function useTripRecommendedEvents(tripId: number, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['trips', tripId, 'recommendations', 'events', page, limit],
    queryFn: () => tripExtendedService.getRecommendedEvents(tripId, page, limit),
    enabled: !!tripId,
  });
}

// Places filtering hook
export function useTripPlaces(
  tripId: number,
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    provinceIds?: number[];
    minRating?: number;
    bestSeason?: string[];
  }
) {
  return useQuery({
    queryKey: ['trips', tripId, 'places', filters],
    queryFn: () => tripExtendedService.getPlacesInTripProvinces(tripId, filters),
    enabled: !!tripId,
  });
}

// Trip day item management hooks
export function useAddTripDayItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      dayNumber,
      item,
    }: {
      tripId: number;
      dayNumber: number;
      item: CreateTripDayItemRequest;
    }) => tripExtendedService.addItemToTripDay(tripId, dayNumber, item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] });
      const item = variables.item;
      if (item.item_type === 'place' && item.item_id) {
        import('@/lib/services/interaction').then(({ interactionService }) =>
          interactionService.track({ place_id: item.item_id, interaction_type: 'add_to_trip' }),
        );
      } else if (item.item_type === 'event' && item.item_id) {
        import('@/lib/services/interaction').then(({ interactionService }) =>
          interactionService.track({ event_id: item.item_id, interaction_type: 'add_to_trip' }),
        );
      }
    },
  });
}

export function useUpdateTripDayItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      dayNumber,
      itemId,
      updates,
    }: {
      tripId: number;
      dayNumber: number;
      itemId: number;
      updates: UpdateTripDayItemRequest;
    }) => tripExtendedService.updateTripDayItem(tripId, dayNumber, itemId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] });
    },
  });
}

export function useRemoveTripDayItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      dayNumber,
      itemId,
    }: {
      tripId: number;
      dayNumber: number;
      itemId: number;
    }) => tripExtendedService.removeTripDayItem(tripId, dayNumber, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] });
    },
  });
}

export function useReorderTripDayItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tripId,
      dayNumber,
      items,
    }: {
      tripId: number;
      dayNumber: number;
      items: ReorderItemsRequest;
    }) => tripExtendedService.reorderTripDayItems(tripId, dayNumber, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] });
    },
  });
}

// Events filtering hook
export function useTripEvents(
  tripId: number,
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    provinceIds?: number[];
    minRating?: number;
  }
) {
  return useQuery({
    queryKey: ['trips', tripId, 'events', filters],
    queryFn: () => tripExtendedService.getEventsInTripProvinces(tripId, filters),
    enabled: !!tripId,
  });
}

// Saved items hook
export function useTripSavedItems(
  tripId: number,
  type: 'place' | 'event',
  page: number = 1,
  limit: number = 8,
) {
  return useQuery({
    queryKey: ['trips', tripId, 'saved', type, page, limit],
    queryFn: () => tripExtendedService.getSavedItemsForTrip(tripId, type, page, limit),
    enabled: !!tripId,
  });
}

// Re-export services for direct usage if needed
export { tripService, tripExtendedService };

