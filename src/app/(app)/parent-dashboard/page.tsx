"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Progress, Badge, Tabs, TabsList, TabsTrigger, TabsContent, EmptyState } from "@/components/ui";
import { ProfileCard, InterestCard } from "@/components/domain";
import { Avatar } from "@/components/ui";
import { Users, Heart, Bookmark, Activity, Eye, Settings, Loader2 } from "lucide-react";
import type { MatchCard, Interest } from "@/types";
import { useTranslation } from "@/lib/i18n";

export default function ParentDashboardPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(0);
  const [childOccupation, setChildOccupation] = useState("");
  const [childCity, setChildCity] = useState("");
  const [childCommunity, setChildCommunity] = useState("");
  const [childProfileComplete, setChildProfileComplete] = useState(0);
  const [childPhotoUrl, setChildPhotoUrl] = useState("");

  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [shortlisted, setShortlisted] = useState<MatchCard[]>([]);
  const [activityLog, setActivityLog] = useState<{ time: string; action: string }[]>([]);
  const [profileViews, setProfileViews] = useState(0);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [profileRes, matchRes, interestRes, shortlistRes, viewersRes] = await Promise.all([
          fetch("/api/profiles/me"),
          fetch("/api/matches?page=1&limit=12"),
          fetch("/api/interests?type=received"),
          fetch("/api/shortlist"),
          fetch("/api/visitors"),
        ]);

        // Profile
        if (profileRes.ok) {
          const data = await profileRes.json();
          const p = data.profile || {};
          const u = data.user || {};
          setChildName(p.fullName || "");
          setChildAge(p.age || 0);
          setChildOccupation(p.occupation || "");
          setChildCity(p.city || "");
          setChildCommunity(p.community || "");
          setChildProfileComplete(u.profileComplete || 0);
          const primary = (p.photos || []).find((ph: any) => ph.isPrimary) || (p.photos || [])[0];
          setChildPhotoUrl(primary?.url || "");
        }

        // Matches
        if (matchRes.ok) {
          const data = await matchRes.json();
          setMatches(data.profiles || []);
        }

        // Interests
        let interestData: any = null;
        if (interestRes.ok) {
          interestData = await interestRes.json();
          setInterests(interestData.interests || []);
        }

        // Shortlist
        if (shortlistRes.ok) {
          const data = await shortlistRes.json();
          const mapped: MatchCard[] = (data.shortlist ?? []).map((item: any) => {
            const pr = item.profile || {};
            return {
              id: item._id?.toString() || item.shortlistedUserId,
              profileId: item.shortlistedUserId,
              fullName: pr.fullName || "",
              age: pr.age || 0,
              height: pr.height || "",
              occupation: pr.occupation || "",
              location: pr.city || "",
              community: pr.community || "",
              primaryPhotoUrl: pr.photos?.[0]?.url || "",
              isVerified: pr.verificationStatus === "verified",
              isPremium: false,
              isOnline: pr.isOnline || false,
              isShortlisted: true,
            };
          });
          setShortlisted(mapped);
        }

        // Visitors
        if (viewersRes.ok) {
          const data = await viewersRes.json();
          const visitors = data.visitors || [];
          setProfileViews(visitors.length);

          // Build activity log from interests + visitors
          const log: { time: string; action: string }[] = [];

          // Add interest activity
          if (interestData) {
            for (const interest of (interestData.interests || []).slice(0, 5)) {
              log.push({
                time: interest.sentAt || interest.createdAt || new Date().toISOString(),
                action: `Interest received from ${interest.profile?.fullName || "someone"}`,
              });
            }
          }

          // Add visitor activity
          for (const visitor of visitors.slice(0, 5)) {
            log.push({
              time: visitor.createdAt || new Date().toISOString(),
              action: `Profile viewed by ${visitor.viewerName || "someone"}`,
            });
          }

          // Sort by time descending
          log.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setActivityLog(log.slice(0, 10));
        }
      } catch (err) {
        console.error("Failed to fetch parent dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const handleAccept = useCallback(async (id: string) => {
    try {
      await fetch(`/api/interests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      setInterests((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to accept interest:", err);
    }
  }, []);

  const handleDecline = useCallback(async (id: string) => {
    try {
      await fetch(`/api/interests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      setInterests((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to decline interest:", err);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const firstName = childName.split(" ")[0] || "Child";

  return (
    <div className="space-y-8">
      {/* Parent header */}
      <div className="flex items-center justify-between">
        <div>
          <Badge variant="primary" size="md" className="mb-2">
            <Users className="h-3 w-3" /> {t.parentDashboard.title}
          </Badge>
          <h1 className="text-2xl font-bold text-neutral-900">
            {t.parentDashboard.managingProfile.replace("{name}", firstName)}
          </h1>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/settings"><Settings className="h-4 w-4" /> {t.nav.settings}</Link>
        </Button>
      </div>

      {/* Child's profile overview */}
      <Card variant="flat" padding="lg">
        <div className="flex items-center gap-4">
          <Avatar name={childName || "?"} size="xl" src={childPhotoUrl || undefined} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-neutral-900">
              {childName}{childAge ? `, ${childAge}` : ""}
            </h2>
            <p className="text-sm text-neutral-500">
              {[childOccupation, childCity, childCommunity].filter(Boolean).join(" · ")}
            </p>
            <Progress value={childProfileComplete} showPercentage size="sm" label={t.parentDashboard.profileCompletion} className="mt-3 max-w-xs" />
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link href="/profile/me"><Eye className="h-4 w-4" /> {t.parentDashboard.viewProfile}</Link>
          </Button>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: t.parentDashboard.newMatches, value: String(matches.length), icon: Heart, color: "text-primary-600" },
          { label: t.parentDashboard.interestsReceived, value: String(interests.length), icon: Heart, color: "text-secondary-600" },
          { label: t.parentDashboard.shortlisted, value: String(shortlisted.length), icon: Bookmark, color: "text-info" },
          { label: t.parentDashboard.profileViews, value: String(profileViews), icon: Eye, color: "text-neutral-600" },
        ].map((stat) => (
          <Card key={stat.label} variant="flat" padding="md">
            <div className="flex items-center gap-3">
              <div className={`${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">{t.parentDashboard.recommendedMatches}</TabsTrigger>
          <TabsTrigger value="interests">{t.parentDashboard.interestInbox}</TabsTrigger>
          <TabsTrigger value="shortlist">{t.parentDashboard.myShortlist}</TabsTrigger>
          <TabsTrigger value="activity">{t.parentDashboard.activityLog}</TabsTrigger>
        </TabsList>

        <TabsContent value="matches">
          {matches.length === 0 ? (
            <EmptyState
              icon={<Heart className="h-8 w-8" />}
              title={t.shared.noMatchesYet}
              description={t.shared.completeProfileHint}
              action={{ label: t.shared.completeProfile, href: "/profile/me" }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map((match) => (
                <ProfileCard key={match.id} profile={match} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="interests">
          <div className="space-y-3">
            {interests.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">{t.shared.noPending}</p>
            ) : (
              interests.map((interest) => (
                <InterestCard
                  key={interest.id}
                  interest={interest}
                  type="received"
                  onAccept={() => handleAccept(interest.id)}
                  onDecline={() => handleDecline(interest.id)}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="shortlist">
          {shortlisted.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="h-8 w-8" />}
              title={t.shared.noShortlistedProfiles}
              description={t.shared.browseMatchesHint}
              action={{ label: t.shared.browseMatches, href: "/search" }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {shortlisted.map((match) => (
                <ProfileCard key={match.id} profile={match} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          <Card variant="flat" padding="lg">
            {activityLog.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-4">{t.shared.noRecentActivity}</p>
            ) : (
              <div className="space-y-4">
                {activityLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Activity className="h-4 w-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-neutral-700">{log.action}</p>
                      <p className="text-xs text-neutral-400">{log.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
