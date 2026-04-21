"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Card } from "@/components/ui";
import { MatchScore, VerifiedBadge, ProfileCard, PremiumUpsell } from "@/components/domain";
import {
  Heart,
  Share2,
  Flag,
  Ban,
  MapPin,
  Briefcase,
  GraduationCap,
  Star,
  ArrowLeft,
  Check,
  Lock,
  Phone,
  Mail,
  MessageSquare,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface ProfileData {
  _id: string;
  userId: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  location: string;
  education: string;
  community: string;
  profileId: string;
  isOnline: boolean;
  verificationStatus: string;
  aboutMe: string;
  height: string;
  diet: string;
  motherTongue: string;
  smoking: string;
  maritalStatus: string;
  drinking: string;
  hobbies: string[];
  familyType: string;
  familyStatus: string;
  fatherOccupation: string;
  motherOccupation: string;
  brothers: string;
  sisters: string;
  familyValues: string;
  highestDegree: string;
  institution: string;
  employer: string;
  annualIncome: string;
  workLocation: string;
  partnerPreferences: {
    ageRange: string;
    heightRange: string;
    education: string;
    occupation: string;
    community: string;
    location: string;
    starMatch: string;
    diet: string;
  };
  horoscope: {
    star: string;
    rashi: string;
    dosham: string;
  };
  compatibilityScore: number;
  compatibilityFactors: { label: string; matched: boolean }[];
  photos: string[];
  primaryPhotoUrl: string;
  phone: string;
  email: string;
  conversationId?: string;
  isShortlisted?: boolean;
  interestSent?: boolean;
}

export default function ProfileViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();
  const [interestSent, setInterestSent] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [reported, setReported] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const { isPremium } = useCurrentUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingInterest, setSendingInterest] = useState(false);
  const [togglingShortlist, setTogglingShortlist] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/profiles/${id}`);
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        const u = data.user || {};
        const p = data.profile || {};

        const photos = (p.photos || []).map((ph: any) => ph.url || ph).filter(Boolean);
        const primaryPhoto = (p.photos || []).find((ph: any) => ph.isPrimary);

        const mapped: ProfileData = {
          _id: p._id?.toString() || id,
          userId: p.userId?.toString() || id,
          name: p.fullName || "",
          age: p.age || 0,
          gender: u.gender || "",
          occupation: p.occupation || "",
          location: [p.city, p.state].filter(Boolean).join(", "),
          education: p.highestDegree || "",
          community: p.community || "",
          profileId: p._id?.toString() || id,
          isOnline: p.isOnline || false,
          verificationStatus: p.verificationStatus || "unverified",
          aboutMe: p.aboutMe || "",
          height: p.height || "",
          diet: p.diet || "",
          motherTongue: p.motherTongue || "",
          smoking: p.smoking || "",
          maritalStatus: p.maritalStatus || "",
          drinking: p.drinking || "",
          hobbies: p.hobbies || [],
          familyType: p.familyType || "",
          familyStatus: p.familyStatus || "",
          fatherOccupation: p.fatherOccupation || "",
          motherOccupation: p.motherOccupation || "",
          brothers: [p.brothersMarried && `${p.brothersMarried} married`, p.brothersUnmarried && `${p.brothersUnmarried} unmarried`].filter(Boolean).join(", ") || "",
          sisters: [p.sistersMarried && `${p.sistersMarried} married`, p.sistersUnmarried && `${p.sistersUnmarried} unmarried`].filter(Boolean).join(", ") || "",
          familyValues: "",
          highestDegree: p.highestDegree || "",
          institution: p.institution || "",
          employer: p.employer || "",
          annualIncome: p.annualIncome || "",
          workLocation: p.workLocation || "",
          partnerPreferences: {
            ageRange: data.partnerPreferences?.ageRange ? `${data.partnerPreferences.ageRange[0]} - ${data.partnerPreferences.ageRange[1]} yrs` : "",
            heightRange: data.partnerPreferences?.heightRange ? `${data.partnerPreferences.heightRange[0]} - ${data.partnerPreferences.heightRange[1]}` : "",
            education: (data.partnerPreferences?.education || []).join(", "),
            occupation: (data.partnerPreferences?.occupation || []).join(", "),
            community: (data.partnerPreferences?.communities || []).join(", "),
            location: (data.partnerPreferences?.locations || []).join(", "),
            starMatch: data.partnerPreferences?.starCompatibility || "",
            diet: data.partnerPreferences?.diet || "",
          },
          horoscope: {
            star: p.star || "",
            rashi: p.rashi || "",
            dosham: p.hasDosham === true ? "Yes" : p.hasDosham === false ? "No" : "Unknown",
          },
          compatibilityScore: 0,
          compatibilityFactors: [],
          photos,
          primaryPhotoUrl: primaryPhoto?.url || photos[0] || "",
          phone: u.phone || "",
          email: u.email || "",
          interestSent: data.interestSent ?? false,
          isShortlisted: data.isShortlisted ?? false,
        };

        setProfile(mapped);
        setInterestSent(mapped.interestSent ?? false);
        setIsShortlisted(mapped.isShortlisted ?? false);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id]);

  const handleSendInterest = async () => {
    setSendingInterest(true);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: id }),
      });
      if (!res.ok) throw new Error("Failed to send interest");
      setInterestSent(true);
    } catch (err) {
      console.error("Error sending interest:", err);
    } finally {
      setSendingInterest(false);
    }
  };

  const handleToggleShortlist = async () => {
    setTogglingShortlist(true);
    try {
      const method = isShortlisted ? "DELETE" : "POST";
      const res = await fetch("/api/shortlist", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortlistedUserId: id }),
      });
      if (!res.ok) throw new Error("Failed to update shortlist");
      setIsShortlisted(!isShortlisted);
    } catch (err) {
      console.error("Error toggling shortlist:", err);
    } finally {
      setTogglingShortlist(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">{t.shared.profileNotFound}</p>
        <Button variant="text" size="sm" asChild className="mt-4">
          <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /> Back to Matches</Link>
        </Button>
      </div>
    );
  }

  const phoneClean = profile.phone?.replace(/\D/g, "") ?? "";

  return (
    <div className="space-y-6">
      <Button variant="text" size="sm" asChild>
        <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /> {t.profile.backToMatches}</Link>
      </Button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* Photo gallery */}
      <div className="lg:col-span-5">

        {/* Main image */}
        <div className="aspect-[3/4] rounded-[var(--radius-lg)] bg-neutral-200 overflow-hidden relative">

          {profile.primaryPhotoUrl ? (
            <Image
              src={profile.primaryPhotoUrl}
              alt={profile.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-400 text-lg">
              No Photo
            </div>
          )}

          <div className="absolute top-3 right-3">
            <VerifiedBadge status={profile.verificationStatus as any ?? "unverified"} />
          </div>

          {profile.isOnline && (
            <div className="absolute top-3 left-3">
              <span className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-success">
                <span className="h-2 w-2 rounded-full bg-success" />
                {t.common.onlineNow}
              </span>
            </div>
          )}

        </div>

        {/* Thumbnails */}
        {profile.photos && profile.photos.length > 0 && (
          <div className="mt-3 flex gap-2">
            {profile.photos.slice(0, 4).map((photo, i) => (
              <div
                key={i}
                className="h-16 w-16 rounded-[var(--radius-md)] bg-neutral-200 border-2 border-transparent hover:border-primary-400 cursor-pointer transition-colors overflow-hidden relative"
              >
                <Image src={photo} alt={`Photo ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
        {/* Quick info + actions */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {profile.name}{profile.age ? `, ${profile.age}` : ""}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              {profile.occupation && (
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {profile.occupation}</span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.location}</span>
              )}
              {profile.education && (
                <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {profile.education}</span>
              )}
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              {profile.community && `${profile.community} \u00b7 `}Profile ID: {profile.profileId ?? id}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              variant={interestSent ? "secondary" : "primary"}
              size="lg"
              onClick={handleSendInterest}
              disabled={interestSent || sendingInterest}
            >
              {interestSent ? <Check className="h-5 w-5" /> : <Heart className="h-5 w-5" />}
              {sendingInterest ? t.shared.saving : interestSent ? t.shared.interestSent : t.profile.expressInterest}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={handleToggleShortlist}
              disabled={togglingShortlist}
            >
              <Heart className="h-5 w-5" fill={isShortlisted ? "currentColor" : "none"} />
              {isShortlisted ? t.shared.shortlisted : t.profile.shortlistLabel}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: "Check this profile", url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }
              }}
            >
              <Share2 className="h-5 w-5" /> {linkCopied ? "Link Copied!" : t.profile.shareWithParent}
            </Button>
          </div>

          {/* Compatibility score */}
          <Card variant="flat" padding="lg">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              {t.profile.compatibilityLabel}
            </h3>
            <MatchScore
              score={profile.compatibilityScore ?? 0}
              size="lg"
              factors={profile.compatibilityFactors ?? []}
            />
          </Card>

          {/* Contact Details — Premium Only */}
          <Card variant="flat" padding="lg">
            <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              {t.shared.contactDetails}
            </h3>
            {isPremium ? (
              <div className="space-y-3">
                {profile.phone && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                      <Phone className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Phone</p>
                      <p className="text-sm font-medium text-neutral-900">{profile.phone}</p>
                    </div>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50">
                      <Mail className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Email</p>
                      <p className="text-sm font-medium text-neutral-900">{profile.email}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  {profile.conversationId && (
                    <Button variant="primary" size="sm" className="flex-1" asChild>
                      <Link href={`/chat/${profile.conversationId}`}>
                        <MessageSquare className="h-4 w-4" /> Chat Now
                      </Link>
                    </Button>
                  )}
                  {phoneClean && (
                    <a
                      href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hi, I found your profile (${profile.profileId ?? id}) on Thirumangalyam and I'm interested in connecting.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold text-white transition-colors"
                      style={{ backgroundColor: "#25D366" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1DA851")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#25D366")}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="space-y-3 select-none blur-sm pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                      <Phone className="h-4 w-4 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">Phone</p>
                      <p className="text-sm font-medium text-neutral-400">+91 XXXXX XXXXX</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100">
                      <Mail className="h-4 w-4 text-neutral-400" />
                    </div>
                    <div>
                      <p className="text-xs text-neutral-400">Email</p>
                      <p className="text-sm font-medium text-neutral-400">xxxxx@email.com</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Lock className="h-6 w-6 text-primary-600 mb-2" />
                  <p className="text-sm font-semibold text-neutral-900">{t.shared.premiumFeature}</p>
                  <p className="text-xs text-neutral-500 mt-0.5 text-center">{t.shared.premiumUpgradeHint}</p>
                  <Button variant="premium" size="sm" className="mt-3" asChild>
                    <Link href="/premium">{t.shared.upgradeToPremium}</Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Tabbed details */}
      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about">{t.profile.about}</TabsTrigger>
          <TabsTrigger value="family">{t.profile.family}</TabsTrigger>
          <TabsTrigger value="education">{t.profile.career}</TabsTrigger>
          <TabsTrigger value="preferences">{t.profile.partnerPrefs}</TabsTrigger>
          <TabsTrigger value="horoscope">{t.profile.horoscope}</TabsTrigger>
        </TabsList>

        <TabsContent value="about">
          <Card variant="flat" padding="lg">
            {profile.aboutMe && (
              <p className="text-sm text-neutral-700 leading-relaxed">
                {profile.aboutMe}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4">
              {profile.height && <DetailRow label={t.profile.height} value={profile.height} />}
              {profile.diet && <DetailRow label={t.profile.diet} value={profile.diet} />}
              {profile.motherTongue && <DetailRow label={t.profile.motherTongue} value={profile.motherTongue} />}
              {profile.smoking && <DetailRow label={t.profile.smoking} value={profile.smoking} />}
              {profile.maritalStatus && <DetailRow label={t.profile.maritalStatus} value={profile.maritalStatus} />}
              {profile.drinking && <DetailRow label={t.profile.drinking} value={profile.drinking} />}
            </div>
            {profile.hobbies && profile.hobbies.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-neutral-600 mb-2">{t.profile.hobbies}</p>
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((h) => (
                    <Badge key={h} variant="outline" size="md">{h}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="family">
          <Card variant="flat" padding="lg">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {profile.familyType && <DetailRow label={t.profile.familyType} value={profile.familyType} />}
              {profile.familyStatus && <DetailRow label={t.profile.familyStatus} value={profile.familyStatus} />}
              {profile.fatherOccupation && <DetailRow label={t.profile.father} value={profile.fatherOccupation} />}
              {profile.motherOccupation && <DetailRow label={t.profile.mother} value={profile.motherOccupation} />}
              {profile.brothers && <DetailRow label={t.profile.brothers} value={profile.brothers} />}
              {profile.sisters && <DetailRow label={t.profile.sisters} value={profile.sisters} />}
              {profile.familyValues && <DetailRow label={t.profile.familyValues} value={profile.familyValues} />}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="education">
          <Card variant="flat" padding="lg">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {profile.highestDegree && <DetailRow label={t.profile.highestDegree} value={profile.highestDegree} />}
              {profile.institution && <DetailRow label={t.profile.institution} value={profile.institution} />}
              {profile.occupation && <DetailRow label={t.profile.occupationLabel} value={profile.occupation} />}
              {profile.employer && <DetailRow label={t.profile.employer} value={profile.employer} />}
              {profile.annualIncome && <DetailRow label={t.profile.annualIncome} value={profile.annualIncome} />}
              {profile.workLocation && <DetailRow label={t.profile.workLocation} value={profile.workLocation} />}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card variant="flat" padding="lg">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              {profile.partnerPreferences?.ageRange && <DetailRow label={t.profile.ageRangeLabel} value={profile.partnerPreferences.ageRange} />}
              {profile.partnerPreferences?.heightRange && <DetailRow label={t.profile.height} value={profile.partnerPreferences.heightRange} />}
              {profile.partnerPreferences?.education && <DetailRow label={t.profile.educationLabel} value={profile.partnerPreferences.education} />}
              {profile.partnerPreferences?.occupation && <DetailRow label={t.profile.occupationLabel} value={profile.partnerPreferences.occupation} />}
              {profile.partnerPreferences?.community && <DetailRow label={t.profile.communityLabel} value={profile.partnerPreferences.community} />}
              {profile.partnerPreferences?.location && <DetailRow label={t.landing.location} value={profile.partnerPreferences.location} />}
              {profile.partnerPreferences?.starMatch && <DetailRow label={t.profile.starMatch} value={profile.partnerPreferences.starMatch} />}
              {profile.partnerPreferences?.diet && <DetailRow label={t.profile.diet} value={profile.partnerPreferences.diet} />}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="horoscope">
          <Card variant="flat" padding="lg">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {profile.horoscope?.star && <DetailRow label={t.profile.star} value={profile.horoscope.star} />}
              {profile.horoscope?.rashi && <DetailRow label={t.profile.rashi} value={profile.horoscope.rashi} />}
              {profile.horoscope?.dosham && <DetailRow label={t.profile.dosham} value={profile.horoscope.dosham} />}
            </div>
            <Button variant="premium" asChild>
              <Link href={`/horoscope-match/${id}`}>
                <Star className="h-4 w-4" /> {t.profile.viewHoroscopeMatch}
              </Link>
            </Button>
            <p className="mt-2 text-xs text-neutral-500">
              {t.profile.horoscopeDetail}
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Report/Block */}
      <div className="flex items-center justify-center gap-6 pt-4 text-sm">
        <button
          onClick={async () => {
            if (!confirm("Are you sure you want to report this profile?")) return;
            try {
              const res = await fetch("/api/reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  reportedUserId: profile.userId,
                  reason: "fake_profile",
                  description: "Reported from profile page",
                }),
              });
              if (res.ok || res.status === 201) {
                setReported(true);
              }
            } catch (err) {
              console.error("Report error:", err);
            }
          }}
          disabled={reported}
          className="flex items-center gap-1 text-neutral-400 hover:text-error transition-colors disabled:opacity-50"
        >
          <Flag className="h-4 w-4" /> {reported ? t.shared.reported : t.profile.reportProfile}
        </button>
        <button
          onClick={async () => {
            if (!confirm("Block this user? They won't be able to see your profile or contact you.")) return;
            try {
              const res = await fetch("/api/block", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blockedUserId: profile.userId }),
              });
              if (res.ok) {
                setBlocked(true);
              }
            } catch (err) {
              console.error("Block error:", err);
            }
          }}
          disabled={blocked}
          className="flex items-center gap-1 text-neutral-400 hover:text-error transition-colors disabled:opacity-50"
        >
          <Ban className="h-4 w-4" /> {blocked ? t.shared.blocked : t.profile.blockPerson}
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-neutral-800">{value}</p>
    </div>
  );
}
