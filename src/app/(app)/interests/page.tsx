"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent, EmptyState, Badge } from "@/components/ui";
import { InterestCard } from "@/components/domain";
import { Heart, Send, Handshake, Inbox, Loader2 } from "lucide-react";
import type { Interest } from "@/types";
import { useTranslation } from "@/lib/i18n";

export default function InterestsPage() {
  return (
    <Suspense>
      <InterestsPageInner />
    </Suspense>
  );
}

function InterestsPageInner() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "received";

  const [received, setReceived] = useState<Interest[]>([]);
  const [sent, setSent] = useState<Interest[]>([]);
  const [accepted, setAccepted] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [receivedRes, sentRes, acceptedRes] = await Promise.all([
        fetch("/api/interests?type=received"),
        fetch("/api/interests?type=sent"),
        fetch("/api/interests?type=accepted"),
      ]);

      if (!receivedRes.ok || !sentRes.ok || !acceptedRes.ok) {
        throw new Error("Failed to fetch interests");
      }

      const [receivedData, sentData, acceptedData] = await Promise.all([
        receivedRes.json(),
        sentRes.json(),
        acceptedRes.json(),
      ]);

      setReceived(receivedData.interests ?? []);
      setSent(sentData.interests ?? []);
      setAccepted(acceptedData.interests ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) throw new Error("Failed to accept interest");

      const item = received.find((i) => i.id === id);
      if (item) {
        setReceived((prev) => prev.filter((i) => i.id !== id));
        setAccepted((prev) => [
          ...prev,
          { ...item, status: "accepted" as const, respondedAt: new Date().toISOString() },
        ]);
      }
    } catch {
      setError("Failed to accept interest. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      if (!res.ok) throw new Error("Failed to decline interest");

      setReceived((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Failed to decline interest. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdraw = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });
      if (!res.ok) throw new Error("Failed to withdraw interest");

      setSent((prev) => prev.filter((i) => i.id !== id));
    } catch {
      setError("Failed to withdraw interest. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error && received.length === 0 && sent.length === 0 && accepted.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t.interests.title}</h1>
        <div className="text-center py-12">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchInterests}
            className="mt-3 text-sm text-primary-600 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t.interests.title}</h1>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(val) => router.replace(`/interests?tab=${val}`)}>
        <TabsList>
          <TabsTrigger value="received">
            <Inbox className="h-4 w-4" />
            {t.nav.received}
            <Badge variant="primary" size="sm">{received.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="h-4 w-4" />
            {t.nav.sent}
            <Badge variant="default" size="sm">{sent.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="accepted">
            <Handshake className="h-4 w-4" />
            {t.nav.accepted}
            <Badge variant="success" size="sm">{accepted.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          <div className="space-y-3">
            {received.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-8">No pending interests.</p>
            )}
            {received.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                type="received"
                onAccept={() => handleAccept(interest.id)}
                onDecline={() => handleDecline(interest.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sent">
          <div className="space-y-3">
            {sent.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-8">No sent interests.</p>
            )}
            {sent.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                type="sent"
                onWithdraw={() => handleWithdraw(interest.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accepted">
          <div className="space-y-3">
            {accepted.length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-8">
                No accepted interests yet.
              </p>
            )}
            {accepted.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                type="accepted"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
