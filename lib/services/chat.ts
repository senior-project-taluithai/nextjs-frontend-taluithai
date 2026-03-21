import { api } from "../api-client";

export interface ChatConversation {
  id: string;
  threadId: string;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export const chatService = {
  createConversation: async (data: {
    threadId?: string;
    title?: string;
    initialMessage?: string;
  }): Promise<ChatConversation> => {
    const response = await api.post<ChatConversation>("/chat", data);
    return response.data;
  },

  getConversations: async (params?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<ChatConversation>> => {
    const response = await api.get<PaginatedResponse<ChatConversation>>(
      "/chat",
      {
        params,
      },
    );
    return response.data;
  },

  getConversation: async (id: string): Promise<ChatConversation> => {
    const response = await api.get<ChatConversation>(`/chat/${id}`);
    return response.data;
  },

  updateConversation: async (
    id: string,
    data: { title: string },
  ): Promise<ChatConversation> => {
    const response = await api.patch<ChatConversation>(`/chat/${id}`, data);
    return response.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await api.delete(`/chat/${id}`);
  },

  getMessages: async (
    conversationId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<PaginatedResponse<ChatMessage>> => {
    const response = await api.get<PaginatedResponse<ChatMessage>>(
      `/chat/${conversationId}/messages`,
      { params },
    );
    return response.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
  ): Promise<Response> => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || ""}/chat/${conversationId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
        credentials: "include",
      },
    );
    return response;
  },
};
