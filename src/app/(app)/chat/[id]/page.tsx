"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Avatar, Button } from "@/components/ui";
import { ChatBubble, ChatInput } from "@/components/domain";
import { ArrowLeft, MoreVertical, Phone, Loader2 } from "lucide-react";
import type { ChatMessage } from "@/types";
import { useTranslation } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface OtherUser {
  name: string;
  isOnline: boolean;
  userId: string;
  primaryPhotoUrl?: string;
}

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const { userId } = useCurrentUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch(`/api/chat/${id}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();

      setMessages((prev) => {
        const newMessages = data.messages ?? [];
        // Only update if there are actual new messages (avoid overwriting optimistic ones)
        if (!isInitial && prev.length > 0) {
          const hasOptimistic = prev.some((m) => m.status === "sending");
          if (hasOptimistic) {
            // Merge: keep optimistic messages, add any truly new server messages
            const serverIds = new Set(newMessages.map((m: any) => m._id || m.id));
            const optimistic = prev.filter(
              (m) => m.status === "sending" && !serverIds.has(m.id)
            );
            return [...newMessages, ...optimistic];
          }
        }
        return newMessages;
      });

      if (data.otherParticipant) {
        const p = data.otherParticipant;
        setOtherUser({
          name: p.fullName || "",
          isOnline: p.isOnline || false,
          userId: p.userId?.toString() || "",
          primaryPhotoUrl: p.photos?.[0]?.url,
        });
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMessages(true);

    // Poll every 5 seconds for new messages in active conversation
    pollRef.current = setInterval(() => fetchMessages(false), 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async (text: string) => {
    const optimisticMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      conversationId: id,
      senderId: userId,
      content: text,
      type: "text",
      sentAt: new Date().toISOString(),
      isRead: false,
      status: "sending",
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`/api/chat/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const data = await res.json();
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMsg.id
            ? { ...msg, ...data, status: "sent" as const }
            : msg
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === optimisticMsg.id ? { ...msg, status: "failed" as const } : msg
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-64px-56px)] lg:h-[calc(100dvh-64px)] -mx-4 -my-6 md:-mx-6 lg:-mx-8">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3">
        <Button variant="text" size="sm" asChild className="lg:hidden">
          <Link href="/chat"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <Avatar
          name={otherUser?.name ?? ""}
          size="md"
          showOnline={otherUser?.isOnline}
          src={otherUser?.primaryPhotoUrl}
        />
        <div className="flex-1 min-w-0">
          <Link
            href={`/profile/${otherUser?.userId ?? ""}`}
            className="text-sm font-semibold text-neutral-900 hover:text-primary-600"
          >
            {otherUser?.name ?? "Unknown"}
          </Link>
          {otherUser?.isOnline ? (
            <p className="text-xs text-success">{t.common.onlineNow}</p>
          ) : (
            <p className="text-xs text-neutral-400">Offline</p>
          )}
        </div>
        <Button variant="ghost" size="icon" title="Voice calls coming soon" disabled>
          <Phone className="h-5 w-5 text-neutral-300" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5 text-neutral-500" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-bg-secondary px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === userId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
}
