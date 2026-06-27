"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Button, Card, Progress, Badge, EmptyState } from "@/components/ui";
import { ProfileCard, PremiumUpsell } from "@/components/domain";
import { ArrowRight, Sparkles, Star, Clock, Crown, Loader2, CheckCircle, Calendar, AlertTriangle, Lock, History, Check, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { MatchCard } from "@/types";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { isPremium, profileComplete } = useCurrentUser();
  const [verificationStatus, setVerificationStatus] = useState<string>("");
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [lockedCount, setLockedCount] = useState(0);
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [matchError, setMatchError] = useState<{ code: number; message: string } | null>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [browseHistory, setBrowseHistory] = useState<any[]>([]);
  const [matchPage, setMatchPage] = useState(1);
  const [matchTotalPages, setMatchTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
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
          setLockedCount(data.lockedCount ?? 0);
          setMatchPage(1);
          setMatchTotalPages(data.pagination?.totalPages ?? 1);
        } else {
          const errData = await matchRes.json().catch(() => ({}));
          setMatchError({ code: matchRes.status, message: errData.error || "Failed to load matches" });
        }
        if (shortlistRes.ok) {
          const data = await shortlistRes.json();
          const ids = new Set<string>((data.shortlist || []).map((s: any) => s.shortlistedUserId?.toString()).filter(Boolean));
          setShortlistedIds(ids);
        }
        if (subRes.ok) {
          const data = await subRes.json();
          setActiveSub(data.active || null);
        }
        // Browse history — non-blocking
        fetch("/api/browse-history")
          .then((r) => r.json())
          .then((d) => setBrowseHistory((d.profiles || []).slice(0, 8)))
          .catch(() => {});

        // Verification status — non-blocking
        fetch("/api/profiles/me")
          .then((r) => r.json())
          .then((d) => setVerificationStatus(d.profile?.verificationStatus || "unverified"))
          .catch(() => {});
      } catch (err) {
        console.error("Failed to fetch matches:", err);
        setMatchError({ code: 500, message: "Network error. Please refresh." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleShortlist = async (profileId: string) => {
    // Map Profile._id → userId (shortlist API requires userId)
    const match = matches.find((m) => m.id === profileId);
    const userId = match?.userId || profileId;

    const isCurrently = shortlistedIds.has(userId);
    // Optimistic update keyed by userId
    setShortlistedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

    try {
      if (isCurrently) {
        await fetch("/api/shortlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistedUserId: userId }),
        });
      } else {
        await fetch("/api/shortlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shortlistedUserId: userId }),
        });
      }
    } catch {
      // Revert on error
      setShortlistedIds((prev) => {
        const next = new Set(prev);
        if (isCurrently) next.add(userId);
        else next.delete(userId);
        return next;
      });
    }
  };

  const handleSkip = (id: string) => {
    setSkipped((prev) => new Set(prev).add(id));
  };

  const handleLoadMoreMatches = async () => {
    if (loadingMore || matchPage >= matchTotalPages) return;
    const nextPage = matchPage + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/matches?page=${nextPage}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setMatches((prev) => [...prev, ...(data.profiles || [])]);
        setMatchPage(nextPage);
        setMatchTotalPages(data.pagination?.totalPages ?? matchTotalPages);
      }
    } catch {
      // silently ignore load-more errors
    } finally {
      setLoadingMore(false);
    }
  };

  const visibleMatches = matches.filter((m) => !skipped.has(m.id));

  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = matches.filter(
    (m) => m.joinedAt && Date.now() - new Date(m.joinedAt).getTime() < ONE_WEEK_MS
  );
  const starMatches = matches.filter((m) => (m.compatibilityScore ?? 0) >= 60);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  // Session is stale (user deleted from DB) or auth error
  if (matchError?.code === 401) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <AlertTriangle className="h-7 w-7 text-amber-600" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Session Expired</h2>
        <p className="text-sm text-neutral-500 max-w-xs">
          Your account was not found. This usually happens after demo data is refreshed.
          Please sign in again.
        </p>
        <Button variant="primary" onClick={() => signOut({ callbackUrl: "/login" })}>
          Sign Out &amp; Login Again
        </Button>
      </div>
    );
  }

  // Profile not created yet
  if (matchError?.code === 400) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
          <Sparkles className="h-7 w-7 text-primary-600" />
        </div>
        <h2 className="text-lg font-semibold text-neutral-900">Complete Your Profile</h2>
        <p className="text-sm text-neutral-500 max-w-xs">
          Set up your profile to start seeing matches.
        </p>
        <Button variant="primary" asChild>
          <Link href="/profile/me">Complete Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Verification banner */}
      {verificationStatus === "unverified" && profileComplete >= 60 && (
        <Card variant="flat" padding="md" className="border-l-4 border-l-amber-400 bg-amber-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">Get your profile verified</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verified profiles get 40% more responses and rank higher in search results.
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" asChild className="shrink-0">
              <Link href="/profile/me?tab=photos#verification">Verify Now →</Link>
            </Button>
          </div>
        </Card>
      )}

      {verificationStatus === "rejected" && (
        <Card variant="flat" padding="md" className="border-l-4 border-l-red-400 bg-red-50">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Verification rejected — action needed</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Your document was not accepted. Please re-submit a clearer photo ID.
                </p>
              </div>
            </div>
            <Button variant="destructive" size="sm" asChild className="shrink-0">
              <Link href="/profile/me?tab=photos#verification">Re-submit →</Link>
            </Button>
          </div>
        </Card>
      )}

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
            <Badge variant="primary" size="sm">
              {isPremium ? matches.length : Math.min(matches.length, FREE_DAILY_LIMIT)} {t.common.new}
            </Badge>
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
          <>
            {/* Show max FREE_DAILY_LIMIT for free users */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {(isPremium ? visibleMatches : visibleMatches.slice(0, FREE_DAILY_LIMIT)).map((match) => (
                <ProfileCard
                  key={match.id}
                  profile={{ ...match, isShortlisted: shortlistedIds.has(match.userId) }}
                  onShortlist={handleShortlist}
                  onSkip={handleSkip}
                />
              ))}
            </div>

            {/* Load more — premium users with multiple pages */}
            {isPremium && matchPage < matchTotalPages && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  disabled={loadingMore}
                  onClick={handleLoadMoreMatches}
                >
                  {loadingMore ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Loading…</>
                  ) : (
                    "Load more matches"
                  )}
                </Button>
              </div>
            )}

            {/* Locked upgrade section for free users when there are more matches */}
            {!isPremium && lockedCount > 0 && (
              <div className="relative mt-6 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 blur-sm pointer-events-none select-none opacity-50">
                  {visibleMatches.slice(0, 2).map((match) => (
                    <ProfileCard
                      key={`locked-${match.id}`}
                      profile={{ ...match, isShortlisted: false }}
                    />
                  ))}
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm rounded-2xl px-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 mb-3">
                    <Lock className="h-7 w-7 text-primary-600" />
                  </div>
                  <p className="text-lg font-bold text-neutral-900">
                    {lockedCount}+ More Matches Waiting
                  </p>
                  <p className="text-sm text-neutral-500 mt-1 max-w-sm">
                    Upgrade to Premium to unlock all matches, send unlimited interests, and connect via chat &amp; WhatsApp.
                  </p>
                  <Button variant="premium" size="lg" className="mt-4" asChild>
                    <Link href="/premium">
                      <Crown className="h-4 w-4" /> Upgrade to Premium
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* New This Week — Premium only */}
      {isPremium && newThisWeek.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-neutral-500" />
              <h2 className="text-xl font-bold text-neutral-900">{t.dashboard.newThisWeek}</h2>
              <Badge variant="primary" size="sm">{newThisWeek.length} {t.common.new}</Badge>
            </div>
            <Button variant="text" size="sm" asChild>
              <Link href="/search">{t.common.viewAll} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
            {newThisWeek.slice(0, 8).map((match) => (
              <div key={match.id} className="min-w-[280px] snap-start">
                <ProfileCard
                  profile={{ ...match, isShortlisted: shortlistedIds.has(match.userId) }}
                  onShortlist={handleShortlist}
                  variant="compact"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Star Matches — Premium only, profiles with ≥60% compatibility score */}
      {isPremium && starMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary-500" />
              <h2 className="text-xl font-bold text-neutral-900">{t.dashboard.mutualStarMatches}</h2>
              <Badge variant="secondary" size="sm">{starMatches.length}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {starMatches.slice(0, 6).map((match) => (
              <ProfileCard
                key={match.id}
                profile={{ ...match, isShortlisted: shortlistedIds.has(match.userId) }}
                onShortlist={handleShortlist}
              />
            ))}
          </div>
        </section>
      )}

      {/* Browse History */}
      {browseHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-neutral-400" />
              <h2 className="text-xl font-bold text-neutral-900">Recently Viewed</h2>
            </div>
            <Link href="/who-viewed-me" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {browseHistory.map((p) => (
              <Link
                key={p.userId}
                href={`/profile/${p.userId}`}
                className="group flex-shrink-0 flex flex-col items-center gap-1.5 w-20"
              >
                <div className="relative h-16 w-16 rounded-full overflow-hidden bg-neutral-100 border-2 border-transparent group-hover:border-primary-400 transition-colors">
                  {p.primaryPhoto ? (
                    <img src={p.primaryPhoto} alt={p.name} className="h-full w-full object-cover object-top" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-xl font-bold text-neutral-300">
                      {p.name?.charAt(0)}
                    </div>
                  )}
                  {p.verificationStatus === "verified" && (
                    <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                      <Check className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-neutral-700 font-medium text-center truncate w-full leading-tight">
                  {p.name?.split(" ")[0]}, {p.age}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Premium upsell */}
      {!isPremium && <PremiumUpsell feature="general" />}
    </div>
  );
}
