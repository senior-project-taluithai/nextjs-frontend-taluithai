import { api } from '../api-client';
import { Place } from '../dtos/place.dto';
import { Event } from '../dtos/event.dto';
import { PaginatedResponse } from '../dtos/pagination.dto';

export const favoriteService = {
  getFavoritePlaces: async (page = 1, pageSize = 10): Promise<PaginatedResponse<Place>> => {
    const response = await api.get<PaginatedResponse<Place>>('/favorites/places', {
      params: { page, pageSize },
    });
    return response.data;
  },

  getFavoriteEvents: async (page = 1, pageSize = 10): Promise<PaginatedResponse<Event>> => {
    const response = await api.get<PaginatedResponse<Event>>('/favorites/events', {
      params: { page, pageSize },
    });
    return response.data;
  },

  toggleFavoritePlace: async (id: number): Promise<void> => {
    await api.post(`/favorites/places/${id}`);
  },

  toggleFavoriteEvent: async (id: number): Promise<void> => {
    await api.post(`/favorites/events/${id}`);
  },

  checkFavoritePlace: async (id: number): Promise<boolean> => {
    // API might return boolean directly, or wrapped object.
    const response = await api.get<any>(`/favorites/places/${id}/is-saved`);
    const data = response.data;
    if (typeof data === 'boolean') return data;
    if (typeof data === 'object' && data !== null) {
        return !!(data.isSaved || data.is_saved || data.saved || data.data);
    }
    return !!data;
  },

  checkFavoriteEvent: async (id: number): Promise<boolean> => {
    const response = await api.get<any>(`/favorites/events/${id}/is-saved`);
    const data = response.data;
    if (typeof data === 'boolean') return data;
    if (typeof data === 'object' && data !== null) {
        return !!(data.isSaved || data.is_saved || data.saved || data.data);
    }
    return !!data;
  },
};
