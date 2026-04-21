"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Avatar, Badge, EmptyState } from "@/components/ui";
import { PremiumUpsell } from "@/components/domain";
import { MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  isOnline: boolean;
  otherUserId: string;
  primaryPhotoUrl?: string;
}

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ChatListPage() {
  const { t } = useTranslation();
  const { isPremium } = useCurrentUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConversations = useCallback(async (isInitial = false) => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations(true);

    // Poll every 10 seconds for new messages / unread counts
    pollRef.current = setInterval(() => fetchConversations(false), 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchConversations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-8 w-8" />}
        title={t.chat.noConversations}
        description={t.chat.noConversationsDesc}
        action={{ label: t.interests.findMatches, href: "/search" }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t.chat.title}</h1>

      {!isPremium && (
        <PremiumUpsell feature="chat" />
      )}

      <div className="rounded-[var(--radius-lg)] border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-200">
        {conversations.map((conv, i) => (
          <Link
            key={conv.id}
            href={isPremium ? `/chat/${conv.id}` : "/premium"}
            className={cn(
              "flex items-center gap-4 px-4 py-3 transition-colors relative",
              conv.unread > 0 && isPremium && "bg-primary-50/30",
              isPremium ? "hover:bg-neutral-50" : i >= 1 ? "opacity-50 pointer-events-auto" : "hover:bg-neutral-50"
            )}
          >
            <Avatar name={conv.name} size="lg" showOnline={conv.isOnline} src={conv.primaryPhotoUrl} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-sm truncate",
                  conv.unread > 0 ? "font-semibold text-neutral-900" : "font-medium text-neutral-800"
                )}>
                  {conv.name}
                </span>
                <span className="text-xs text-neutral-400 shrink-0 ml-2">
                  {formatRelativeTime(conv.lastMessageAt)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={cn(
                  "text-sm truncate",
                  !isPremium && i >= 1 ? "blur-sm select-none" : "",
                  conv.unread > 0 ? "text-neutral-800 font-medium" : "text-neutral-500"
                )}>
                  {conv.lastMessage}
                </p>
                {conv.unread > 0 && isPremium && (
                  <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white">
                    {conv.unread}
                  </span>
                )}
                {!isPremium && i >= 1 && (
                  <Badge variant="outline" size="sm" className="ml-2 shrink-0">
                    <MessageSquare className="h-3 w-3" /> Premium
                  </Badge>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
