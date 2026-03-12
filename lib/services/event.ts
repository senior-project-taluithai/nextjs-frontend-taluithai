import { api } from '../api-client';
import { Event, CreateEventDto } from '../dtos/event.dto';

export const eventService = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  getUpcoming: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events/upcoming');
    return response.data;
  },

  explore: async (query: import('../dtos/event.dto').ExploreEventsQuery): Promise<import('../dtos/pagination.dto').PaginatedResponse<Event>> => {
    const response = await api.post<import('../dtos/pagination.dto').PaginatedResponse<Event>>('/events/explore', query);
    return response.data;
  },

  getById: async (id: number): Promise<Event> => {
    const response = await api.get<Event>(`/events/${id}`);
    return response.data;
  },

  create: async (data: CreateEventDto): Promise<Event> => {
    const response = await api.post<Event>('/events', data);
    return response.data;
  },

  addReview: async (id: number, comment: string, rating: number): Promise<any> => {
    const response = await api.post(`/events/${id}/reviews`, { comment, rating });
    return response.data;
  },
};
