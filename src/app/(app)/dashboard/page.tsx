"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Progress, Badge, EmptyState } from "@/components/ui";
import { ProfileCard, PremiumUpsell } from "@/components/domain";
import { ArrowRight, Sparkles, Star, Clock, Crown, Loader2, CheckCircle, Calendar } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { MatchCard } from "@/types";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { isPremium, profileComplete } = useCurrentUser();
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const FREE_DAILY_LIMIT = 10;
  const FREE_INTEREST_LIMIT = 5;

  useEffect(() => {
    async function fetchData() {
      setMounted(true);
      try {
        const [matchRes, shortlistRes, subRes] = await Promise.all([
          fetch("/api/matches?page=1&limit=20"),
          fetch("/api/shortlist"),
          fetch("/api/subscription/me"),
        ]);
        if (matchRes.ok) {
          const data = await matchRes.json();
          setMatches(data.profiles || []);
        }
        if (shortlistRes.ok) {
          const data = await shortlistRes.json();
          const ids = new Set<string>((data.shortlist || []).map((s: any) => s.shortlistedUserId));
          setShortlistedIds(ids);
        }
        if (subRes.ok) {
          const data = await subRes.json();
          setActiveSub(data.active || null);
        }
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleShortlist = async (id: string) => {
    const isCurrently = shortlistedIds.has(id);
    // Optimistic update
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isCurrently) {
        await fetch("/api/shortlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistedUserId: id }),
        });
      } else {
        await fetch("/api/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistedUserId: id }),
        });
      }
    } catch {
      // Revert on error
      setShortlistedIds((prev) => {
        const next = new Set(prev);
        if (isCurrently) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const handleSkip = (id: string) => {
    setSkipped((prev) => new Set(prev).add(id));
  };

  const visibleMatches = matches.filter((m) => !skipped.has(m.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile completion banner */}
      {profileComplete < 100 && (
        <Card variant="alert" padding="lg" className="border-l-primary-600 bg-primary-50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-neutral-900">
                {t.dashboard.completeProfileBanner}
              </h2>
              <Progress value={profileComplete} showPercentage size="sm" className="mt-2 max-w-xs" />
            </div>
            <Button variant="primary" size="sm" asChild>
              <Link href="/profile/me">{t.dashboard.completeNow}</Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Membership banner */}
      {isPremium && activeSub ? (
        <Card variant="flat" padding="md" className="border-primary-200 bg-gradient-to-r from-primary-50 to-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <Crown className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-primary-900">Premium Member</p>
                  <Badge variant="premium" size="sm">Active</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-primary-700">
                  <span className="flex items-center gap-1" suppressHydrationWarning>
                    <Calendar className="h-3 w-3" />
                    {mounted ? `Expires ${new Date(activeSub.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : "—"}
                  </span>
                  <span className="flex items-center gap-1" suppressHydrationWarning>
                    <Clock className="h-3 w-3" />
                    {mounted ? `${Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / 86400000))} days left` : "—"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-primary-700">
              <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Unlimited matches</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-green-500" /> Chat & contacts</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings">View Plan</Link>
              </Button>
            </div>
          </div>
        </Card>
      ) : !isPremium ? (
        <Card variant="flat" padding="md" className="border-amber-200 bg-amber-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Crown className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Free Plan Limits</p>
                <p className="text-xs text-amber-700">
                  {FREE_DAILY_LIMIT} daily matches &middot; {FREE_INTEREST_LIMIT} interests/day &middot; No chat or contact details
                </p>
              </div>
            </div>
            <Button variant="premium" size="sm" asChild>
              <Link href="/premium">Upgrade for Unlimited</Link>
            </Button>
          </div>
        </Card>
      ) : null}

      {/* Today's Matches */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-secondary-500" />
            <h2 className="text-xl font-bold text-neutral-900">{t.dashboard.todaysMatches}</h2>
            <Badge variant="primary" size="sm">{matches.length} {t.common.new}</Badge>
          </div>
          <Button variant="text" size="sm" asChild>
            <Link href="/search">{t.common.viewAll} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {visibleMatches.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title={t.shared.noMatchesYet}
            description={t.shared.completeProfileHint}
            action={{ label: t.shared.completeProfile, href: "/profile/me" }}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleMatches.map((match) => (
              <ProfileCard
                key={match.id}
                profile={{ ...match, isShortlisted: shortlistedIds.has(match.id) }}
                onShortlist={handleShortlist}
                onSkip={handleSkip}
              />
            ))}
          </div>
        )}
      </section>

      {/* New This Week */}
      {matches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-neutral-500" />
              <h2 className="text-xl font-bold text-neutral-900">{t.dashboard.newThisWeek}</h2>
            </div>
            <Button variant="text" size="sm" asChild>
              <Link href="/search">{t.common.viewAll} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {matches.slice(0, 4).map((match) => (
              <div key={match.id} className="min-w-[280px] snap-start">
                <ProfileCard profile={match} variant="compact" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Star Matches */}
      {matches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary-500" />
              <h2 className="text-xl font-bold text-neutral-900">{t.dashboard.mutualStarMatches}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {matches.slice(0, 3).map((match) => (
              <ProfileCard key={match.id} profile={match} />
            ))}
          </div>
        </section>
      )}

      {/* Premium upsell */}
      <PremiumUpsell feature="general" />
    </div>
  );
}
