import { api } from "../api-client";
import { Place } from "../dtos/place.dto";
import type { ExplorePlacesQuery } from "../dtos/place.dto";
import type { PaginatedResponse } from "../dtos/pagination.dto";
import type { MapQueryParams, MapPlacesResponse, MapSummaryQueryParams, MapSummaryResponse } from "../dtos/map.dto";

export const placeService = {
  getRecommended: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>("/places/recommended");
    return response.data;
  },

  getPopular: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>("/places/popular");
    return response.data;
  },

  getHiddenGems: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>("/places/hidden-gems");
    return response.data;
  },

  getBestForSeason: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>("/places/best-for-season");
    return response.data;
  },

  explore: async (query: ExplorePlacesQuery): Promise<PaginatedResponse<Place>> => {
    const response = await api.post<PaginatedResponse<Place>>("/places/explore", query);
    return response.data;
  },

  getAll: async (): Promise<Place[]> => {
    const response = await api.get<Place[]>("/places");
    return response.data;
  },

  getById: async (id: number): Promise<Place> => {
    const response = await api.get<Place>(`/places/${id}`);
    return response.data;
  },

  getTiktokVideos: async (id: number): Promise<string[]> => {
    const response = await api.get<{ videos: string[] }>(`/places/${id}/tiktok-videos`);
    return response.data.videos;
  },

  addReview: async (id: number, comment: string, rating: number): Promise<unknown> => {
    const response = await api.post(`/places/${id}/reviews`, { comment, rating });
    return response.data;
  },

  getMapPlaces: async (query: MapQueryParams): Promise<MapPlacesResponse> => {
    const response = await api.get<MapPlacesResponse>("/places/map", {
      params: {
        north: query.north,
        south: query.south,
        east: query.east,
        west: query.west,
        zoom: query.zoom,
        ...(query.provinceIds && query.provinceIds.length > 0
          ? { province_ids: query.provinceIds.join(",") }
          : {}),
        ...(query.categoryId ? { category_id: query.categoryId } : {}),
        ...(query.minRating ? { min_rating: query.minRating } : {}),
        ...(query.searchTerm ? { search: query.searchTerm } : {}),
      },
    });
    return response.data;
  },
  getMapSummary: async (query: MapSummaryQueryParams): Promise<MapSummaryResponse> => {
    const response = await api.get<MapSummaryResponse>("/places/map/summary", {
      params: {
        ...(query.provinceIds && query.provinceIds.length > 0
          ? { province_ids: query.provinceIds.join(",") }
          : {}),
        ...(query.categoryId ? { category_id: query.categoryId } : {}),
        ...(query.minRating ? { min_rating: query.minRating } : {}),
        ...(query.searchTerm ? { search: query.searchTerm } : {}),
      },
    });
    return response.data;
  },
};