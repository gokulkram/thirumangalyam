"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Heart, Trash2, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { useTranslation } from "@/lib/i18n";
import type { MatchCard } from "@/types";

export default function ShortlistPage() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchShortlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shortlist");
      if (!res.ok) throw new Error("Failed to fetch shortlist");
      const data = await res.json();

      const mapped: MatchCard[] = (data.shortlist ?? []).map((item: any) => {
        const photos = item.profile?.photos || [];
        const primaryPhoto = photos.find((ph: any) => ph.isPrimary) || photos[0];
        // Use the User ID as profileId — the profile page resolves both User ID and Profile ID
        const userId = item.shortlistedUserId?.toString() || "";
        return {
          id: item._id?.toString() || "",
          profileId: userId,
          userId,
          fullName: item.profile?.fullName ?? "",
          age: item.profile?.age ?? 0,
          height: item.profile?.height ?? "",
          occupation: item.profile?.occupation ?? "",
          location: item.profile?.city ?? "",
          community: item.profile?.community ?? "",
          primaryPhotoUrl: primaryPhoto?.url || "",
          isVerified: item.profile?.verificationStatus === "verified",
          isPremium: item.profile?.isPremium ?? false,
          isOnline: item.profile?.isOnline ?? false,
          isShortlisted: true,
        };
      });

      setProfiles(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShortlist();
  }, [fetchShortlist]);

  const removeFromShortlist = async (profile: MatchCard) => {
    setRemovingId(profile.id);
    try {
      const res = await fetch("/api/shortlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortlistedUserId: profile.userId }),
      });
      if (!res.ok) throw new Error("Failed to remove from shortlist");

      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    } catch {
      setError("Failed to remove profile. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t.shortlistPage.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {profiles.length} {profiles.length !== 1 ? t.shortlistPage.profilesSaved : t.shortlistPage.profileSaved}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {profiles.length === 0 ? (
        <Card variant="flat" padding="lg" className="text-center py-16">
          <Heart className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-700">{t.shortlistPage.noSavedProfiles}</h2>
          <p className="text-sm text-neutral-500 mt-1 mb-4">
            {t.shortlistPage.noSavedHint}
          </p>
          <Button asChild>
            <Link href="/search">{t.shortlistPage.browseProfiles}</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <Card key={p.id} variant="flat" padding="md" className="flex flex-col">
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-3">
                {p.primaryPhotoUrl ? (
                  <img
                    src={p.primaryPhotoUrl}
                    alt={p.fullName}
                    className="h-14 w-14 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-lg font-bold shrink-0">
                    {p.fullName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {p.fullName}, {p.age}
                    </h3>
                    {p.isVerified && <CheckCircle className="h-4 w-4 text-success shrink-0" />}
                  </div>
                  <p className="text-sm text-neutral-600 truncate">{p.occupation}</p>
                  <div className="flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3" />
                    {p.location} &middot; {p.community}
                  </div>
                </div>
              </div>

              {/* Compatibility */}
              {p.compatibilityScore !== undefined && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-1.5 flex-1 rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        p.compatibilityScore >= 80
                          ? "bg-success"
                          : p.compatibilityScore >= 60
                          ? "bg-secondary-500"
                          : "bg-warning"
                      }`}
                      style={{ width: `${p.compatibilityScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-neutral-600">
                    {p.compatibilityScore}% match
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto">
                <Button variant="secondary" size="sm" className="flex-1" asChild>
                  <Link href={`/profile/${p.profileId}`}>{t.shortlistPage.viewProfile}</Link>
                </Button>
                <button
                  onClick={() => removeFromShortlist(p)}
                  disabled={removingId === p.id}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                  aria-label="Remove from shortlist"
                >
                  {removingId === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
