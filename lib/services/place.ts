import { api } from '../api-client';
import { Place } from '../dtos/place.dto';

export const placeService = {
  getRecommended: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>('/places/recommended');
    return response.data;
  },

  getPopular: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>('/places/popular');
    return response.data;
  },

  getBestForSeason: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>('/places/best-for-season');
    return response.data;
  },

  explore: async (query: import('../dtos/place.dto').ExplorePlacesQuery): Promise<import('../dtos/pagination.dto').PaginatedResponse<Place>> => {
    const response = await api.post<import('../dtos/pagination.dto').PaginatedResponse<Place>>('/places/explore', query);
    return response.data;
  },

  getAll: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>('/places');
    return response.data;
  },

  getById: async (id: number): Promise<Place> => {
    const response = await api.get<Place>(`/places/${id}`);
    return response.data;
  },
};
