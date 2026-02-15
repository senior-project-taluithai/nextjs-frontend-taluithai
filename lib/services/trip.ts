import { api } from '@/lib/api-client';
import { TripDto, TripDetailDto, PlaceDto, EventDto } from '@/lib/mock-data';
import { PaginatedResult } from '@/lib/dtos/pagination.dto';
import { 
    CreateTripRequest, 
    UpdateTripRequest, 
    CreateTripDayItemRequest, 
    UpdateTripDayItemRequest, 
    ReorderItemsRequest 
} from '@/lib/dtos/trip.dto';

// Standard Trip API
export const tripService = {
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

// Extended Trip API (Features)
export const tripExtendedService = {
  // Recommendations
  getRecommendedPlaces: async (tripId: number, page: number = 1, limit: number = 10) => {
    const response = await api.get<PaginatedResult<PlaceDto>>(`/trips/${tripId}/recommendations/places`, {
      params: { page, limit },
    });
    return response.data;
  },

  getRecommendedEvents: async (tripId: number, page: number = 1, limit: number = 10) => {
    const response = await api.get<PaginatedResult<EventDto>>(`/trips/${tripId}/recommendations/events`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Places in trip provinces
  getPlacesInTripProvinces: async (
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
  ) => {
    const response = await api.post<PaginatedResult<PlaceDto>>(`/trips/${tripId}/places`, {
      page: filters.page || 1,
      limit: filters.limit || 8,
      search: filters.search,
      category_id: filters.category,
      province_ids: filters.provinceIds,
      min_rating: filters.minRating,
      best_season: filters.bestSeason,
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

  // Events in trip provinces
  getEventsInTripProvinces: async (
    tripId: number,
    filters: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      provinceIds?: number[];
      minRating?: number;
    }
  ) => {
    const response = await api.post<PaginatedResult<EventDto>>(`/trips/${tripId}/events`, {
      page: filters.page || 1,
      limit: filters.limit || 8,
      search: filters.search,
      category_id: filters.category,
      province_ids: filters.provinceIds,
      min_rating: filters.minRating,
    });
    return response.data;
  },

  getSavedItemsForTrip: async (
    tripId: number,
    type: 'place' | 'event',
    page: number = 1,
    limit: number = 8,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await api.get<PaginatedResult<any>>(`/trips/${tripId}/saved`, {
      params: { type, page, limit },
    });
    return response.data;
  },

  // General Search (for AI Planner)
  searchPlaces: async (query: string) => {
    const response = await api.post<PaginatedResult<PlaceDto>>('/places/explore', {
      search: query,
      limit: 1
    });
    return response.data;
  },
};
