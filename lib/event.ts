import { api } from './api-client';
import { Event, CreateEventDto } from './dtos/event.dto';

export const eventService = {
  getAll: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events');
    return response.data;
  },

  getUpcoming: async (): Promise<Event[]> => {
    const response = await api.get<Event[]>('/events/upcoming');
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
};
