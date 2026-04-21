"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Eye, Lock, Crown, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";

interface Visitor {
  id: string;
  profileId: string;
  name: string;
  age: number;
  occupation: string;
  location: string;
  community: string;
  visitedAt: string;
  isVerified: boolean;
  isBlurred: boolean;
  photoUrl: string;
}

export default function WhoViewedMePage() {
  const { t } = useTranslation();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/visitors");
      if (!res.ok) throw new Error("Failed to fetch visitors");
      const data = await res.json();

      const mapped: Visitor[] = (data.visitors ?? []).map((v: any) => {
        const photos = v.profile?.photos || [];
        const primaryPhoto = photos.find((ph: any) => ph.isPrimary) || photos[0];
        return {
          id: v._id?.toString() || v.viewerId?.toString() || "",
          profileId: v.profile?.userId?.toString() || v.viewerId?.toString() || "",
          name: v.profile?.fullName || "Unknown",
          age: v.profile?.age || 0,
          occupation: v.profile?.occupation || "",
          location: v.profile?.city || "",
          community: v.profile?.community || "",
          visitedAt: v.createdAt || "",
          isVerified: v.profile?.verificationStatus === "verified",
          isBlurred: v.blurred || false,
          photoUrl: primaryPhoto?.url || "",
        };
      });
      setVisitors(mapped);
      setIsPremium(data.isPremium ?? false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  const visibleCount = visitors.filter((v) => !v.isBlurred).length;
  const blurredCount = visitors.filter((v) => v.isBlurred).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error && visitors.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">{t.whoViewedMe.title}</h1>
        <div className="text-center py-12">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchVisitors}
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
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t.whoViewedMe.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {visitors.length} people viewed your profile recently
        </p>
      </div>

      {/* Premium upsell */}
      {blurredCount > 0 && (
        <Card variant="flat" padding="md" className="bg-primary-50 border-primary-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-900">
                {blurredCount} more profile{blurredCount !== 1 ? "s" : ""} viewed you
              </p>
              <p className="text-xs text-primary-700">
                Upgrade to Premium to see all visitors with full details
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/premium">Upgrade</Link>
            </Button>
          </div>
        </Card>
      )}

      {visitors.length === 0 && (
        <div className="text-center py-12">
          <Eye className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700">{t.whoViewedMe.noVisitors}</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {t.whoViewedMe.noVisitorsHint}
          </p>
        </div>
      )}

      {/* Visitor list */}
      {visitors.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visitors.map((v) => (
            <Card key={v.id} variant="flat" padding="md" className="relative">
              {v.isBlurred && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-[var(--radius-lg)]">
                  <Lock className="h-6 w-6 text-neutral-400 mb-2" />
                  <p className="text-sm font-medium text-neutral-600">{t.whoViewedMe.premiumOnly}</p>
                  <Button size="sm" variant="secondary" className="mt-2" asChild>
                    <Link href="/premium">{t.whoViewedMe.unlock}</Link>
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3">
                {v.photoUrl ? (
                  <img
                    src={v.photoUrl}
                    alt={v.name}
                    className="h-12 w-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-lg font-bold shrink-0">
                    {v.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {v.name}, {v.age}
                    </h3>
                    {v.isVerified && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                  </div>
                  <p className="text-sm text-neutral-600 truncate">{v.occupation}</p>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3" />
                    {v.location} &middot; {v.community}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-neutral-400">
                  <Eye className="h-3 w-3" />
                  {v.visitedAt ? new Date(v.visitedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                </span>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/profile/${v.profileId}`}>{t.whoViewedMe.viewProfile}</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
