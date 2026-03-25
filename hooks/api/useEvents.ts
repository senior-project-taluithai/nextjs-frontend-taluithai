import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventService } from "@/lib/services/event";
import { CreateEventDto } from "@/lib/dtos/event.dto";

export const useEvents = () => {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => eventService.getAll(),
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ["events", "upcoming"],
    queryFn: () => eventService.getUpcoming(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useExploreEvents = (
  query: import("@/lib/dtos/event.dto").ExploreEventsQuery,
) => {
  return useQuery({
    queryKey: ["events", "explore", query],
    queryFn: () => eventService.explore(query),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
};

export const useEvent = (id: number) => {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventService.getById(id),
    enabled: !!id,
  });
};

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventDto) => eventService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
};

export const useAddEventReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      comment,
      rating,
    }: {
      id: number;
      comment: string;
      rating: number;
    }) => eventService.addReview(id, comment, rating),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["events", Number(variables.id)],
      });
    },
  });
};

export const useMonthEvents = (year: number, month: number) => {
  return useQuery({
    queryKey: ["events", "month", year, month],
    queryFn: () => eventService.getEventsByMonth(year, month),
  });
};

export const useTiktokVideos = (eventId: number) => {
  return useQuery({
    queryKey: ["events", eventId, "tiktok-videos"],
    queryFn: () => eventService.getTiktokVideos(eventId),
    enabled: !!eventId,
    staleTime: 60 * 60 * 1000,
  });
};
