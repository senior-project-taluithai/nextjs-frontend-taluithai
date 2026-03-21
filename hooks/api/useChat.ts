import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  chatService,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/services/chat";

export function useChatConversations(params?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ["chat", "conversations", params],
    queryFn: () => chatService.getConversations(params),
  });
}

export function useChatConversation(id: string) {
  return useQuery({
    queryKey: ["chat", "conversations", id],
    queryFn: () => chatService.getConversation(id),
    enabled: !!id,
  });
}

export function useChatMessages(
  conversationId: string | null,
  params?: { limit?: number; offset?: number },
) {
  return useQuery({
    queryKey: ["chat", "conversations", conversationId, "messages", params],
    queryFn: () =>
      conversationId
        ? chatService.getMessages(conversationId, params)
        : Promise.resolve({ data: [], total: 0 }),
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      threadId?: string;
      title?: string;
      initialMessage?: string;
    }) => chatService.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { title: string } }) =>
      chatService.updateConversation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chat", "conversations", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => chatService.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export { chatService };
export type { ChatConversation, ChatMessage };
