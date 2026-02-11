import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { TripDto, TripDetailDto } from '@/lib/mock-data';

// Request DTOs
export interface CreateTripRequest {
  name: string;
  start_date: string;
  end_date: string;
  province_ids: number[];
  status?: 'draft' | 'upcoming' | 'completed';
}

export interface UpdateTripRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  province_ids?: number[];
  status?: 'draft' | 'upcoming' | 'completed';
}

// API functions
const tripsApi = {
  getAll: async (): Promise<TripDto[]> => {
    const response = await api.get<TripDto[]>('/trips');
    return response.data;
  },

  getById: async (id: number): Promise<TripDetailDto> => {
    const response = await api.get<TripDetailDto>(`/trips/${id}`);
    return response.data;
  },

  create: async (data: CreateTripRequest): Promise<TripDto> => {
    const response = await api.post<TripDto>('/trips', data);
    return response.data;
  },

  update: async (id: number, data: UpdateTripRequest): Promise<TripDto> => {
    const response = await api.put<TripDto>(`/trips/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/trips/${id}`);
  },
};

// React Query hooks
export function useTrips() {
  return useQuery({
    queryKey: ['trips'],
    queryFn: tripsApi.getAll,
  });
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => tripsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tripsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useUpdateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTripRequest }) =>
      tripsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trips', variables.id] });
    },
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: tripsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// ============ New Features ============

// Types for trip day items
export interface TripDayItem {
  id: number;
  item_type?: 'place' | 'event';
  place_id?: number;
  event_id?: number;
  note?: string;
  order: number;
  start_time?: string;
  end_time?: string;
}

export interface CreateTripDayItemRequest {
  item_type: 'place' | 'event';
  item_id: number;
  note?: string;
  order?: number;
  start_time?: string;
  end_time?: string;
}

export interface UpdateTripDayItemRequest {
  note?: string;
  order?: number;
  start_time?: string;
  end_time?: string;
}

export interface ReorderItemsRequest {
  items: Array<{ id: number; order: number }>;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  lastPage: number;
  total: number;
}

// Extended API functions
const tripExtendedApi = {
  // Recommendations
  getRecommendedPlaces: async (tripId: number, page: number = 1, limit: number = 10) => {
    const response = await api.get<PaginatedResult<any>>(`/trips/${tripId}/recommendations/places`, {
      params: { page, limit },
    });
    return response.data;
  },

  getRecommendedEvents: async (tripId: number, page: number = 1, limit: number = 10) => {
    const response = await api.get<PaginatedResult<any>>(`/trips/${tripId}/recommendations/events`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Places in trip provinces
  getPlacesInTripProvinces: async (
    tripId: number,
    page: number = 1,
    limit: number = 8,
    search?: string,
    category?: string,
  ) => {
    const response = await api.get<PaginatedResult<any>>(`/trips/${tripId}/places`, {
      params: { page, limit, search, category },
    });
    return response.data;
  },

  // Trip day item management
  addItemToTripDay: async (tripId: number, dayNumber: number, item: CreateTripDayItemRequest) => {
    const response = await api.post(`/trips/${tripId}/days/${dayNumber}/items`, item);
    return response.data;
  },

  updateTripDayItem: async (
    tripId: number,
    dayNumber: number,
    itemId: number,
    updates: UpdateTripDayItemRequest,
  ) => {
    const response = await api.put(`/trips/${tripId}/days/${dayNumber}/items/${itemId}`, updates);
    return response.data;
  },

  removeTripDayItem: async (tripId: number, dayNumber: number, itemId: number) => {
    const response = await api.delete(`/trips/${tripId}/days/${dayNumber}/items/${itemId}`);
    return response.data;
  },

  reorderTripDayItems: async (tripId: number, dayNumber: number, items: ReorderItemsRequest) => {
    const response = await api.put(`/trips/${tripId}/days/${dayNumber}/reorder`, items);
    return response.data;
  },
};

// Recommendation hooks
export function useTripRecommendedPlaces(tripId: number, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['trips', tripId, 'recommendations', 'places', page, limit],
    queryFn: () => tripExtendedApi.getRecommendedPlaces(tripId, page, limit),
    enabled: !!tripId,
  });
}

export function useTripRecommendedEvents(tripId: number, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['trips', tripId, 'recommendations', 'events', page, limit],
    queryFn: () => tripExtendedApi.getRecommendedEvents(tripId, page, limit),
    enabled: !!tripId,
  });
}

// Places filtering hook
export function useTripPlaces(
  tripId: number,
  page: number = 1,
  limit: number = 8,
  search?: string,
  category?: string,
) {
  return useQuery({
    queryKey: ['trips', tripId, 'places', page, limit, search, category],
    queryFn: () => tripExtendedApi.getPlacesInTripProvinces(tripId, page, limit, search, category),
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
    }) => tripExtendedApi.addItemToTripDay(tripId, dayNumber, item),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] });
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
    }) => tripExtendedApi.updateTripDayItem(tripId, dayNumber, itemId, updates),
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
    }) => tripExtendedApi.removeTripDayItem(tripId, dayNumber, itemId),
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
    }) => tripExtendedApi.reorderTripDayItems(tripId, dayNumber, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['trips', variables.tripId] });
    },
  });
}
