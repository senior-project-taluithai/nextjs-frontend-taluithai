import { api } from "../api-client";
import { Event, CreateEventDto } from "../dtos/event.dto";
import type { ExploreEventsQuery } from "../dtos/event.dto";
import type { PaginatedResponse } from "../dtos/pagination.dto";
import type { MapQueryParams, MapEventsResponse, MapSummaryQueryParams, MapSummaryResponse } from "../dtos/map.dto";

export const eventService = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>("/events");
    return response.data;
  },

  getUpcoming: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>("/events/upcoming");
    return response.data;
  },

  getUpcomingByProvinces: async (
    provinceIds: number[],
    startDate?: string,
    endDate?: string,
  ): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (provinceIds.length > 0) {
      params.append("province_ids", provinceIds.join(","));
    }
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);

    const query = params.toString() ? `?${params.toString()}` : "";
    const response = await api.get<Event[]>(
      `/events/upcoming-by-provinces${query}`,
    );
    return response.data;
  },

  explore: async (query: ExploreEventsQuery): Promise<PaginatedResponse<Event>> => {
    const response = await api.post<PaginatedResponse<Event>>("/events/explore", query);
    return response.data;
  },

  getById: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  create: async (data: CreateEventDto): Promise<Event> => {
    const response = await api.post<Event>("/events", data);
    return response.data;
  },

  addReview: async (
    id: number,
    comment: string,
    rating: number,
  ): Promise<unknown> => {
    const response = await api.post(`/events/${id}/reviews`, {
      comment,
      rating,
    });
    return response.data;
  },

  getEventsByMonth: async (year: number, month: number): Promise<Event[]> => {
    const response = await api.get<Event[]>(
      `/events/by-month?year=${year}&month=${month}`,
    );
    return response.data;
  },

  getTiktokVideos: async (id: number): Promise<string[]> => {
    const response = await api.get<{ videos: string[] }>(
      `/events/${id}/tiktok-videos`,
    );
    return response.data.videos;
  },

  getMapEvents: async (query: MapQueryParams): Promise<MapEventsResponse> => {
    const response = await api.get<MapEventsResponse>("/events/map", {
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
    const response = await api.get<MapSummaryResponse>("/events/map/summary", {
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