import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { eventService } from "@/lib/event";
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
  });
};

export const useExploreEvents = (query: import("@/lib/dtos/event.dto").ExploreEventsQuery) => {
  return useQuery({
    queryKey: ["events", "explore", query],
    queryFn: () => eventService.explore(query),
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
