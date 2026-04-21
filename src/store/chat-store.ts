import { create } from "zustand";
import type { ChatConversation, ChatMessage } from "@/types";

interface ChatState {
  conversations: ChatConversation[];
  activeMessages: ChatMessage[];
  activeConversationId: string | null;
  setConversations: (conversations: ChatConversation[]) => void;
  setActiveMessages: (messages: ChatMessage[]) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (message: ChatMessage) => void;
  totalUnread: () => number;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeMessages: [],
  activeConversationId: null,
  setConversations: (conversations) => set({ conversations }),
  setActiveMessages: (activeMessages) => set({ activeMessages }),
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),
  addMessage: (message) =>
    set((state) => ({
      activeMessages: [...state.activeMessages, message],
    })),
  totalUnread: () => get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),
}));
