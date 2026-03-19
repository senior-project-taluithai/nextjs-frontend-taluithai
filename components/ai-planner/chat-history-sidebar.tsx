"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Plus,
  Search,
  Trash2,
  ChevronRight,
  MessageSquare,
  X,
  Pencil,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import {
  useChatConversations,
  useDeleteConversation,
  useUpdateConversation,
  useCreateConversation,
} from "@/hooks/api/useChat";

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeConversationId?: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatHistorySidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const { data: conversationsData, isLoading } = useChatConversations({
    limit: 50,
  });
  const deleteMutation = useDeleteConversation();
  const updateMutation = useUpdateConversation();

  const conversations = conversationsData?.data || [];

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.title?.toLowerCase().includes(query) ||
        conv.lastMessage?.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      await deleteMutation.mutateAsync(id);
      if (activeConversationId === id) {
        onNewConversation();
      }
    }
  };

  const startEditing = (
    e: React.MouseEvent,
    conv: { id: string; title: string },
  ) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title || "New Chat");
  };

  const saveEditing = async () => {
    if (editingId && editingTitle.trim()) {
      await updateMutation.mutateAsync({
        id: editingId,
        data: { title: editingTitle.trim() },
      });
    }
    setEditingId(null);
    setEditingTitle("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: th });
    } catch {
      return "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-gray-900">Chat History</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* New Chat Button */}
              <button
                onClick={onNewConversation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-sm transition-colors shadow-md shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>

              {/* Search */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">
                    {searchQuery
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                  {!searchQuery && (
                    <p className="text-xs text-gray-400 mt-1">
                      Start chatting to see your history
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2">
                  {filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        if (editingId !== conv.id) {
                          onSelectConversation(conv.id);
                        }
                      }}
                      className={`group relative px-4 py-3 cursor-pointer transition-colors ${
                        activeConversationId === conv.id
                          ? "bg-emerald-50 border-l-2 border-emerald-500"
                          : "hover:bg-gray-50 border-l-2 border-transparent"
                      }`}
                    >
                      {editingId === conv.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditing();
                              if (e.key === "Escape") cancelEditing();
                            }}
                            className="flex-1 px-2 py-1 text-sm border border-emerald-400 rounded-lg outline-none focus:ring-2 focus:ring-emerald-400/30"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              saveEditing();
                            }}
                            className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelEditing();
                            }}
                            className="w-7 h-7 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-gray-300 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {conv.title || "New Chat"}
                              </h3>
                              {conv.lastMessage && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {conv.lastMessage}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {formatDate(
                                  conv.lastMessageAt || conv.updatedAt,
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => startEditing(e, conv)}
                                className="w-7 h-7 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                                title="Edit title"
                              >
                                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, conv.id)}
                                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </div>
                          {activeConversationId === conv.id && (
                            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                {conversations.length} conversation
                {conversations.length !== 1 ? "s" : ""}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
