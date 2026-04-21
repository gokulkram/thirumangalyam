"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, Badge, Card, Button, EmptyState } from "@/components/ui";
import { Star, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface ShortlistItem {
  shortlistedUserId: string;
  profile?: {
    fullName?: string;
    star?: string;
    rashi?: string;
    community?: string;
    photos?: { url: string; isPrimary?: boolean }[];
    isOnline?: boolean;
  };
}

export default function HoroscopeMatchIndexPage() {
  const { t } = useTranslation();
  const [profiles, setProfiles] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfiles() {
      try {
        // Load shortlisted + recent interests (accepted) as candidates
        const [shortlistRes, interestRes] = await Promise.all([
          fetch("/api/shortlist"),
          fetch("/api/interests?type=accepted"),
        ]);

        const items: ShortlistItem[] = [];

        if (shortlistRes.ok) {
          const data = await shortlistRes.json();
          for (const s of data.shortlist || []) {
            items.push({
              shortlistedUserId: s.shortlistedUserId?.toString() || s.id,
              profile: s.profile,
            });
          }
        }

        if (interestRes.ok) {
          const data = await interestRes.json();
          const existingIds = new Set(items.map((i) => i.shortlistedUserId));
          for (const interest of data.interests || data.accepted || []) {
            const p = interest.profile;
            const userId = p?.id || p?.profileId || interest.toProfileId || interest.fromProfileId;
            if (userId && !existingIds.has(userId)) {
              items.push({
                shortlistedUserId: userId,
                profile: {
                  fullName: p?.fullName,
                  star: p?.star,
                  community: p?.community,
                  photos: p?.primaryPhotoUrl ? [{ url: p.primaryPhotoUrl, isPrimary: true }] : [],
                  isOnline: p?.isOnline,
                },
              });
            }
          }
        }

        setProfiles(items);
      } catch (err) {
        console.error("Failed to load profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t.horoscope.title}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Check horoscope compatibility with your shortlisted profiles and accepted interests.
        </p>
      </div>

      {profiles.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title="No profiles to compare"
          description="Shortlist profiles or accept interests to check horoscope compatibility."
          action={{ label: "Find Matches", href: "/search" }}
        />
      ) : (
        <div className="grid gap-3">
          {profiles.map((item) => {
            const p = item.profile || {};
            const photo = (p.photos || []).find((ph) => ph.isPrimary) || (p.photos || [])[0];

            return (
              <Link
                key={item.shortlistedUserId}
                href={`/horoscope-match/${item.shortlistedUserId}`}
                className="block"
              >
                <Card variant="flat" padding="md" className="hover:border-primary-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <Avatar
                      name={p.fullName || ""}
                      size="lg"
                      src={photo?.url}
                      showOnline={p.isOnline}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {p.fullName || "Unknown"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {p.star && (
                          <Badge variant="outline" size="sm">
                            <Star className="h-3 w-3" /> {p.star}
                          </Badge>
                        )}
                        {p.community && (
                          <span className="text-xs text-neutral-500">{p.community}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary-600">
                      <span className="text-sm font-medium">View Match</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
