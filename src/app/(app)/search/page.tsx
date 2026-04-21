"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, Input, Select, Slider, Badge, Card, Tabs, TabsList, TabsTrigger, TabsContent, Checkbox } from "@/components/ui";
import {
  SlidersHorizontal,
  X,
  Search,
  MapPin,
  Heart,
  CheckCircle,
  Star,
  ChevronDown,
  Grid3X3,
  LayoutList,
  Sparkles,
  GraduationCap,
  Briefcase,
  Ruler,
  Users,
  Eye,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import { COMMUNITIES, OCCUPATIONS, EDUCATION_LEVELS, HEIGHT_OPTIONS, MOTHER_TONGUES, NAKSHATRAS, INCOME_RANGES, STATES, STATE_CITIES } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n";
import type { MatchCard } from "@/types";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
type SortKey = "relevance" | "newest" | "last_active" | "compatibility";

const QUICK_FILTER_KEYS: Record<string, string> = {
  online: "onlineNow",
  verified: "verified",
  photo: "withPhoto",
  premium: "premium",
};

const QUICK_FILTERS = [
  { value: "online" },
  { value: "verified" },
  { value: "photo" },
  { value: "premium" },
];

const MARITAL_STATUS_OPTIONS = [
  "Never Married",
  "Divorced",
  "Widowed",
  "Awaiting Divorce",
];

const DIET_OPTIONS = [
  "Vegetarian",
  "Non-Vegetarian",
  "Eggetarian",
  "Vegan",
];

const SMOKING_OPTIONS = ["No", "Occasionally", "Yes"];
const DRINKING_OPTIONS = ["No", "Occasionally", "Yes"];

const DOSHAM_OPTIONS = [
  "No Dosham",
  "Chevvai Dosham",
  "Rahu-Ketu Dosham",
  "Don't Know",
];

const FAMILY_TYPE_OPTIONS = ["Joint Family", "Nuclear Family"];
const FAMILY_STATUS_OPTIONS = ["Middle Class", "Upper Middle Class", "Rich", "Affluent"];

interface FilterState {
  ageRange: [number, number];
  heightMin: string;
  heightMax: string;
  community: string;
  motherTongue: string;
  education: string;
  occupation: string;
  state: string;
  city: string;
  income: string;
  maritalStatus: Set<string>;
  diet: Set<string>;
  smoking: string;
  drinking: string;
  nakshatra: string;
  dosham: string;
  familyType: string;
  familyStatus: string;
  profileWithPhoto: boolean;
  profileVerified: boolean;
}

const defaultFilters: FilterState = {
  ageRange: [22, 32],
  heightMin: "",
  heightMax: "",
  community: "",
  motherTongue: "",
  education: "",
  occupation: "",
  state: "",
  city: "",
  income: "",
  maritalStatus: new Set(),
  diet: new Set(),
  smoking: "",
  drinking: "",
  nakshatra: "",
  dosham: "",
  familyType: "",
  familyStatus: "",
  profileWithPhoto: false,
  profileVerified: false,
};

export default function SearchPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortKey>("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuickFilters, setActiveQuickFilters] = useState<Set<string>>(new Set());
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters, maritalStatus: new Set(), diet: new Set() });
  const { t } = useTranslation();

  const [results, setResults] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.ageRange[0] !== 22) params.set("ageMin", String(filters.ageRange[0]));
      if (filters.ageRange[1] !== 32) params.set("ageMax", String(filters.ageRange[1]));
      if (filters.heightMin) params.set("heightMin", filters.heightMin);
      if (filters.heightMax) params.set("heightMax", filters.heightMax);
      if (filters.community) params.set("community", filters.community);
      if (filters.motherTongue) params.set("motherTongue", filters.motherTongue);
      if (filters.education) params.set("education", filters.education);
      if (filters.occupation) params.set("occupation", filters.occupation);
      if (filters.city) params.set("city", filters.city);
      if (filters.nakshatra) params.set("star", filters.nakshatra);
      params.set("page", "1");
      params.set("limit", "30");

      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.profiles || []);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch shortlisted IDs on mount
  useEffect(() => {
    async function fetchShortlist() {
      try {
        const res = await fetch("/api/shortlist");
        if (res.ok) {
          const data = await res.json();
          const ids = new Set<string>((data.shortlist || []).map((s: any) => s.shortlistedUserId));
          setShortlisted(ids);
        }
      } catch (err) {
        console.error("Failed to fetch shortlist:", err);
      }
    }
    fetchShortlist();
  }, []);

  // Fetch results on mount
  useEffect(() => {
    fetchResults();
  }, []);

  const activeFilterCount = [
    filters.community,
    filters.motherTongue,
    filters.education,
    filters.occupation,
    filters.state,
    filters.city,
    filters.income,
    filters.heightMin,
    filters.heightMax,
    filters.smoking,
    filters.drinking,
    filters.nakshatra,
    filters.dosham,
    filters.familyType,
    filters.familyStatus,
    filters.profileWithPhoto ? "yes" : "",
    filters.profileVerified ? "yes" : "",
  ].filter(Boolean).length + filters.maritalStatus.size + filters.diet.size + (filters.ageRange[0] !== 22 || filters.ageRange[1] !== 32 ? 1 : 0);

  const resetFilters = () => setFilters({ ...defaultFilters, maritalStatus: new Set(), diet: new Set() });

  const toggleQuickFilter = (value: string) => {
    setActiveQuickFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleShortlist = async (id: string) => {
    const isCurrently = shortlisted.has(id);
    // Optimistic update
    setShortlisted((prev) => {
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
      setShortlisted((prev) => {
        const next = new Set(prev);
        if (isCurrently) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const filtered = useMemo(() => {
    let list = [...results];
    if (activeQuickFilters.has("online")) list = list.filter((r) => r.isOnline);
    if (activeQuickFilters.has("verified")) list = list.filter((r) => r.isVerified);
    if (activeQuickFilters.has("premium")) list = list.filter((r) => r.isPremium);
    if (activeQuickFilters.has("photo")) list = list.filter((r) => r.primaryPhotoUrl);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.profileId.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.community.toLowerCase().includes(q)
      );
    }
    if (sortBy === "compatibility") list.sort((a, b) => (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0));
    return list;
  }, [results, activeQuickFilters, searchQuery, sortBy]);

  const visibleResults = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visibleCount;

  return (
    <div className="space-y-0">
      {/* Search Hero */}
      <div className="relative -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8 px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 overflow-hidden">
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {t.search.heroTitle}
          </h1>
          <p className="mt-2 text-primary-200 text-sm sm:text-base">
            {t.search.heroSubtitle}
          </p>

          {/* Search bar */}
          <div className="mt-6 flex items-center gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400" />
              <input
                type="text"
                placeholder={t.search.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 rounded-full border-0 bg-white pl-11 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowDesktopFilters(!showDesktopFilters)}
              className={cn(
                "hidden lg:flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-colors",
                showDesktopFilters
                  ? "bg-white text-primary-700"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
              title="Toggle filters"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Quick filters */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {QUICK_FILTERS.map((qf) => (
              <button
                key={qf.value}
                onClick={() => toggleQuickFilter(qf.value)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-medium transition-all",
                  activeQuickFilters.has(qf.value)
                    ? "bg-white text-primary-700 shadow-md"
                    : "bg-white/15 text-white/90 hover:bg-white/25 backdrop-blur-sm"
                )}
              >
                {(t.shared as any)[QUICK_FILTER_KEYS[qf.value]] || qf.value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <span className="text-sm text-neutral-500">
            <span className="font-semibold text-neutral-900">{filtered.length}</span> {t.shared.profilesFound}
          </span>
          {activeQuickFilters.size > 0 && (
            <button
              onClick={() => setActiveQuickFilters(new Set())}
              className="text-xs text-primary-600 hover:underline font-medium"
            >
              {t.search.clearFilters}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="hidden sm:block">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="h-9 rounded-lg border border-neutral-200 bg-white px-3 pr-8 text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="relevance">{t.search.relevance}</option>
              <option value="newest">{t.search.newestFirst}</option>
              <option value="last_active">{t.search.recentlyActive}</option>
              <option value="compatibility">{t.search.compatibility}</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="hidden sm:flex items-center rounded-lg border border-neutral-200 bg-white p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                viewMode === "grid" ? "bg-primary-50 text-primary-700" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                viewMode === "list" ? "bg-primary-50 text-primary-700" : "text-neutral-400 hover:text-neutral-600"
              )}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile filter */}
          <button
            onClick={() => setShowFilters(true)}
            className="lg:hidden flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t.search.filters}
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex gap-6 pt-6">
        {/* Desktop filter sidebar */}
        {showDesktopFilters && (
          <aside className="hidden lg:block w-[280px] shrink-0">
            <div className="sticky top-20 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-neutral-900">{t.search.refineSearch}</h2>
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <button onClick={resetFilters} className="text-xs text-primary-600 hover:underline font-medium">{t.search.resetAll}</button>
              </div>
              <div className="p-5">
                <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} onApply={fetchResults} />
              </div>
            </div>
          </aside>
        )}

        {/* Mobile filter sheet */}
        {showFilters && (
          <div className="fixed inset-0 z-[400] lg:hidden">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-neutral-900">{t.search.filters}</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="px-6 py-4">
                <FilterPanel filters={filters} setFilters={setFilters} onReset={resetFilters} onApply={fetchResults} />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-6 py-4 flex gap-3">
                <Button variant="ghost" size="md" fullWidth onClick={resetFilters}>{t.search.clearAll}</Button>
                <Button variant="primary" size="md" fullWidth onClick={() => { fetchResults(); setShowFilters(false); }}>
                  {t.search.showResults}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                <Search className="h-7 w-7 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">{t.shared.noProfilesFound}</h3>
              <p className="mt-1 text-sm text-neutral-500 max-w-sm">
                {t.search.noResultsHint}
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setActiveQuickFilters(new Set());
                }}
              >
                {t.shared.clearAllFilters}
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {visibleResults.map((profile) => (
                <ModernProfileCard
                  key={profile.id}
                  profile={profile}
                  isShortlisted={shortlisted.has(profile.id)}
                  onToggleShortlist={() => toggleShortlist(profile.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {visibleResults.map((profile) => (
                <ListProfileCard
                  key={profile.id}
                  profile={profile}
                  isShortlisted={shortlisted.has(profile.id)}
                  onToggleShortlist={() => toggleShortlist(profile.id)}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {!loading && remaining > 0 && (
            <div className="mt-10 text-center">
              <Button
                variant="secondary"
                size="lg"
                className="px-10"
                onClick={() => setVisibleCount((c) => Math.min(c + 3, filtered.length))}
              >
                {t.search.loadMore}
                <span className="ml-1.5 text-xs font-normal text-neutral-400">({remaining} {t.search.remaining})</span>
              </Button>
            </div>
          )}

          {!loading && filtered.length > 0 && visibleCount >= filtered.length && (
            <p className="mt-8 text-center text-xs text-neutral-400">
              {t.search.seenAll.replace("{count}", String(filtered.length))}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Modern Grid Card
   ============================================================ */
function ModernProfileCard({
  profile,
  isShortlisted,
  onToggleShortlist,
}: {
  profile: MatchCard;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="group relative rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Photo */}
      <Link href={`/profile/${profile.profileId}`}>
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          {profile.primaryPhotoUrl ? (
            <Image
              src={profile.primaryPhotoUrl}
              alt={profile.fullName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
              <span className="text-5xl font-bold text-primary-300">
                {profile.fullName.charAt(0)}
              </span>
            </div>
          )}

          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex flex-col gap-1.5">
              {profile.isOnline && (
                <span className="flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-green-600 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Online
                </span>
              )}
              {profile.isVerified && (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
            {profile.isPremium && (
              <span className="flex items-center gap-1 rounded-full bg-amber-400/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-amber-900 shadow-sm">
                <Star className="h-3 w-3" />
                Premium
              </span>
            )}
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="text-lg font-bold leading-tight drop-shadow-md">
              {profile.fullName}, {profile.age}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 text-white/90 text-xs">
              <MapPin className="h-3 w-3" />
              <span>{profile.location}</span>
              <span className="mx-0.5 opacity-50">|</span>
              <span>{profile.height}</span>
            </div>
          </div>
        </div>
      </Link>

      {/* Details */}
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Briefcase className="h-3.5 w-3.5 text-neutral-400" />
          <span className="truncate">{profile.occupation}</span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-600">
          <Users className="h-3.5 w-3.5 text-neutral-400" />
          <span className="truncate">{profile.community}</span>
        </div>

        {/* Compatibility */}
        {profile.compatibilityScore !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  profile.compatibilityScore >= 85
                    ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                    : profile.compatibilityScore >= 70
                    ? "bg-gradient-to-r from-amber-400 to-yellow-500"
                    : "bg-gradient-to-r from-orange-400 to-orange-500"
                )}
                style={{ width: `${profile.compatibilityScore}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-bold",
              profile.compatibilityScore >= 85
                ? "text-emerald-600"
                : profile.compatibilityScore >= 70
                ? "text-amber-600"
                : "text-orange-600"
            )}>
              {profile.compatibilityScore}%
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="primary" size="sm" className="flex-1 rounded-xl" asChild>
            <Link href={`/profile/${profile.profileId}`}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {t.search.viewProfile}
            </Link>
          </Button>
          <button
            onClick={onToggleShortlist}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-all duration-200",
              isShortlisted
                ? "border-red-200 bg-red-50 text-red-500 scale-110"
                : "border-neutral-200 text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            )}
            aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
          >
            <Heart
              className="h-4 w-4 transition-transform"
              fill={isShortlisted ? "currentColor" : "none"}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   List View Card
   ============================================================ */
function ListProfileCard({
  profile,
  isShortlisted,
  onToggleShortlist,
}: {
  profile: MatchCard;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="group flex rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Photo */}
      <Link href={`/profile/${profile.profileId}`} className="relative w-36 sm:w-44 shrink-0">
        <div className="relative h-full min-h-[160px] bg-neutral-100">
          {profile.primaryPhotoUrl ? (
            <Image
              src={profile.primaryPhotoUrl}
              alt={profile.fullName}
              fill
              className="object-cover"
              sizes="176px"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
              <span className="text-4xl font-bold text-primary-300">
                {profile.fullName.charAt(0)}
              </span>
            </div>
          )}
          {profile.isOnline && (
            <span className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              Online
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-neutral-900 truncate">
                  {profile.fullName}, {profile.age}
                </h3>
                {profile.isVerified && (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                )}
                {profile.isPremium && (
                  <Badge variant="premium" size="sm">Premium</Badge>
                )}
              </div>
              <p className="text-sm text-neutral-600 truncate mt-0.5">{profile.profileId}</p>
            </div>
            {profile.compatibilityScore !== undefined && (
              <div className={cn(
                "shrink-0 flex items-center gap-1 rounded-lg px-2.5 py-1",
                profile.compatibilityScore >= 85
                  ? "bg-emerald-50 text-emerald-700"
                  : profile.compatibilityScore >= 70
                  ? "bg-amber-50 text-amber-700"
                  : "bg-orange-50 text-orange-700"
              )}>
                <Sparkles className="h-3.5 w-3.5" />
                <span className="text-sm font-bold">{profile.compatibilityScore}%</span>
              </div>
            )}
          </div>

          {/* Details grid */}
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs text-neutral-600">
            <div className="flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-neutral-400" />
              <span>{profile.height}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-400" />
              <span className="truncate">{profile.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-neutral-400" />
              <span className="truncate">{profile.occupation}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-neutral-400" />
              <span className="truncate">{profile.community}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="primary" size="sm" className="rounded-xl" asChild>
            <Link href={`/profile/${profile.profileId}`}>View Profile</Link>
          </Button>
          <Button variant="secondary" size="sm" className="rounded-xl">
            Send Interest
          </Button>
          <button
            onClick={onToggleShortlist}
            className={cn(
              "ml-auto flex h-9 w-9 items-center justify-center rounded-xl border-2 transition-all",
              isShortlisted
                ? "border-red-200 bg-red-50 text-red-500"
                : "border-neutral-200 text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            )}
          >
            <Heart className="h-4 w-4" fill={isShortlisted ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Filter Panel — Advanced
   ============================================================ */
function FilterPanel({
  filters,
  setFilters,
  onReset,
  onApply,
}: {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  onApply: () => void;
}) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["age", "community", "marital"])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const toggleSetValue = (key: "maritalStatus" | "diet", value: string) => {
    setFilters((prev) => {
      const next = new Set(prev[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [key]: next };
    });
  };

  return (
    <div className="space-y-1">
      {/* ─── Basic ─── */}
      <FilterSection title="Age Range" id="age" expanded={expandedSections.has("age")} onToggle={toggleSection}>
        <div className="grid grid-cols-2 gap-2">
          <Select
            placeholder="From"
            value={String(filters.ageRange[0])}
            onValueChange={(v) => setFilters((p) => ({ ...p, ageRange: [Number(v), Math.max(Number(v), p.ageRange[1])] }))}
            options={Array.from({ length: 43 }, (_, i) => ({ value: String(18 + i), label: `${18 + i} yrs` }))}
          />
          <Select
            placeholder="To"
            value={String(filters.ageRange[1])}
            onValueChange={(v) => setFilters((p) => ({ ...p, ageRange: [Math.min(p.ageRange[0], Number(v)), Number(v)] }))}
            options={Array.from({ length: 43 }, (_, i) => ({ value: String(18 + i), label: `${18 + i} yrs` }))}
          />
        </div>
      </FilterSection>

      <FilterSection title="Height" id="height" expanded={expandedSections.has("height")} onToggle={toggleSection}>
        <div className="grid grid-cols-2 gap-2">
          <Select
            placeholder="Min"
            value={filters.heightMin || undefined}
            onValueChange={(v) => setFilters((p) => ({ ...p, heightMin: v }))}
            options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
          />
          <Select
            placeholder="Max"
            value={filters.heightMax || undefined}
            onValueChange={(v) => setFilters((p) => ({ ...p, heightMax: v }))}
            options={HEIGHT_OPTIONS.map((h) => ({ value: h, label: h }))}
          />
        </div>
      </FilterSection>

      <FilterSection title="Marital Status" id="marital" expanded={expandedSections.has("marital")} onToggle={toggleSection}>
        <div className="space-y-2">
          {MARITAL_STATUS_OPTIONS.map((status) => (
            <Checkbox
              key={status}
              label={status}
              checked={filters.maritalStatus.has(status)}
              onCheckedChange={() => toggleSetValue("maritalStatus", status)}
            />
          ))}
        </div>
      </FilterSection>

      {/* ─── Community & Language ─── */}
      <FilterSection title="Mother Tongue" id="motherTongue" expanded={expandedSections.has("motherTongue")} onToggle={toggleSection}>
        <Select
          placeholder="Any language"
          value={filters.motherTongue || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, motherTongue: v }))}
          options={MOTHER_TONGUES.map((l) => ({ value: l, label: l }))}
        />
      </FilterSection>

      <FilterSection title="Community / Caste" id="community" expanded={expandedSections.has("community")} onToggle={toggleSection}>
        <Select
          placeholder="Any community"
          value={filters.community || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, community: v }))}
          options={COMMUNITIES.map((c) => ({ value: c, label: c }))}
        />
      </FilterSection>

      {/* ─── Education & Career ─── */}
      <FilterSection title="Education" id="education" expanded={expandedSections.has("education")} onToggle={toggleSection}>
        <Select
          placeholder="Any education"
          value={filters.education || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, education: v }))}
          options={EDUCATION_LEVELS.flatMap((g) => g.options.map((o) => ({ value: o, label: o, group: g.group })))}
        />
      </FilterSection>

      <FilterSection title="Occupation" id="occupation" expanded={expandedSections.has("occupation")} onToggle={toggleSection}>
        <Select
          placeholder="Any occupation"
          value={filters.occupation || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, occupation: v }))}
          options={OCCUPATIONS.map((o) => ({ value: o, label: o }))}
        />
      </FilterSection>

      <FilterSection title="Annual Income" id="income" expanded={expandedSections.has("income")} onToggle={toggleSection}>
        <Select
          placeholder="Any income"
          value={filters.income || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, income: v }))}
          options={INCOME_RANGES.map((r) => ({ value: r, label: r }))}
        />
      </FilterSection>

      {/* ─── Location ─── */}
      <FilterSection title="State" id="state" expanded={expandedSections.has("state")} onToggle={toggleSection}>
        <Select
          placeholder="Any state"
          value={filters.state || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, state: v, city: "" }))}
          options={STATES.map((s) => ({ value: s, label: s }))}
        />
      </FilterSection>

      <FilterSection title="City" id="city" expanded={expandedSections.has("city")} onToggle={toggleSection}>
        <Select
          placeholder={filters.state ? "Select city" : "Select state first"}
          value={filters.city || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, city: v }))}
          options={
            filters.state && STATE_CITIES[filters.state]
              ? STATE_CITIES[filters.state].map((c) => ({ value: c, label: c }))
              : []
          }
          disabled={!filters.state}
        />
      </FilterSection>

      {/* ─── Horoscope ─── */}
      <FilterSection title="Nakshatra (Star)" id="nakshatra" expanded={expandedSections.has("nakshatra")} onToggle={toggleSection}>
        <Select
          placeholder="Any nakshatra"
          value={filters.nakshatra || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, nakshatra: v }))}
          options={NAKSHATRAS.map((n) => ({ value: n, label: n }))}
        />
      </FilterSection>

      <FilterSection title="Dosham" id="dosham" expanded={expandedSections.has("dosham")} onToggle={toggleSection}>
        <Select
          placeholder="Any"
          value={filters.dosham || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, dosham: v }))}
          options={DOSHAM_OPTIONS.map((d) => ({ value: d, label: d }))}
        />
      </FilterSection>

      {/* ─── Lifestyle ─── */}
      <FilterSection title="Diet" id="diet" expanded={expandedSections.has("diet")} onToggle={toggleSection}>
        <div className="space-y-2">
          {DIET_OPTIONS.map((d) => (
            <Checkbox
              key={d}
              label={d}
              checked={filters.diet.has(d)}
              onCheckedChange={() => toggleSetValue("diet", d)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Smoking" id="smoking" expanded={expandedSections.has("smoking")} onToggle={toggleSection}>
        <div className="flex gap-2">
          {SMOKING_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilters((p) => ({ ...p, smoking: p.smoking === opt ? "" : opt }))}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                filters.smoking === opt
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Drinking" id="drinking" expanded={expandedSections.has("drinking")} onToggle={toggleSection}>
        <div className="flex gap-2">
          {DRINKING_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilters((p) => ({ ...p, drinking: p.drinking === opt ? "" : opt }))}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                filters.drinking === opt
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* ─── Family ─── */}
      <FilterSection title="Family Type" id="familyType" expanded={expandedSections.has("familyType")} onToggle={toggleSection}>
        <div className="flex gap-2">
          {FAMILY_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilters((p) => ({ ...p, familyType: p.familyType === opt ? "" : opt }))}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                filters.familyType === opt
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Family Status" id="familyStatus" expanded={expandedSections.has("familyStatus")} onToggle={toggleSection}>
        <Select
          placeholder="Any"
          value={filters.familyStatus || undefined}
          onValueChange={(v) => setFilters((p) => ({ ...p, familyStatus: v }))}
          options={FAMILY_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
      </FilterSection>

      {/* ─── Profile Attributes ─── */}
      <FilterSection title="Profile Preferences" id="profilePrefs" expanded={expandedSections.has("profilePrefs")} onToggle={toggleSection}>
        <div className="space-y-2">
          <Checkbox
            label="With Photo only"
            checked={filters.profileWithPhoto}
            onCheckedChange={(v) => setFilters((p) => ({ ...p, profileWithPhoto: !!v }))}
          />
          <Checkbox
            label="Verified profiles only"
            checked={filters.profileVerified}
            onCheckedChange={(v) => setFilters((p) => ({ ...p, profileVerified: !!v }))}
          />
        </div>
      </FilterSection>

      <div className="pt-4 flex gap-2">
        <Button variant="ghost" size="sm" fullWidth onClick={onReset}>Clear</Button>
        <Button variant="primary" size="sm" fullWidth onClick={onApply}>Apply</Button>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  id,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  id: string;
  expanded: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-neutral-100 last:border-0">
      <button
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between py-3 text-sm font-medium text-neutral-800 hover:text-neutral-900"
      >
        {title}
        <ChevronDown
          className={cn(
            "h-4 w-4 text-neutral-400 transition-transform duration-200",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded && <div className="pb-4">{children}</div>}
    </div>
  );
}
