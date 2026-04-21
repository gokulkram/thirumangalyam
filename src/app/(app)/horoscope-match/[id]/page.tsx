"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Badge } from "@/components/ui";
import { Avatar } from "@/components/ui";
import { HoroscopeGrid, MatchScore, PremiumUpsell } from "@/components/domain";
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react";
import type { Porutham, HoroscopeMatch } from "@/types";
import { useTranslation } from "@/lib/i18n";

export default function HoroscopeMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [matchData, setMatchData] = useState<HoroscopeMatch | null>(null);
  const [error, setError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function fetchHoroscope() {
      try {
        const res = await fetch(`/api/horoscope-match/${id}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load horoscope match");
        }
        const data: HoroscopeMatch = await res.json();
        setMatchData(data);
      } catch (err: any) {
        console.error("Failed to fetch horoscope:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHoroscope();
  }, [id]);

  const poruthams: Porutham[] = matchData?.poruthams || [];
  const score = matchData?.overallScore || 0;

  const myName = matchData?.profileA?.name?.split(" ")[0] || t.horoscope.you;
  const myStar = matchData?.profileA?.star || "—";
  const myRashi = matchData?.profileA?.rashi || "—";
  const myDosham = matchData?.profileA?.hasDosham;

  const otherFullName = matchData?.profileB?.name || "";
  const otherName = otherFullName
    ? `${otherFullName.split(" ")[0]} ${(otherFullName.split(" ")[1] || "").charAt(0)}.`
    : "—";
  const otherStar = matchData?.profileB?.star || "—";
  const otherRashi = matchData?.profileB?.rashi || "—";
  const otherDosham = matchData?.profileB?.hasDosham;

  function doshamLabel(val: any): string {
    if (val === true) return "Has Dosham";
    if (val === false) return t.horoscope.noDosham;
    return "Unknown";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-center py-20">
        <p className="text-red-600 font-medium">{error}</p>
        <Button variant="secondary" asChild>
          <Link href={`/profile/${id}`}>Back to Profile</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="text" size="sm" asChild>
        <Link href={`/profile/${id}`}><ArrowLeft className="h-4 w-4" /> {t.horoscope.backToProfile}</Link>
      </Button>

      <h1 className="text-2xl font-bold text-neutral-900">{t.horoscope.title}</h1>

      {/* Profiles compared */}
      <Card variant="flat" padding="lg">
        <div className="flex items-center justify-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <Avatar name={myName} size="xl" />
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-900">{myName}</p>
              <p className="text-xs text-neutral-500">{myStar} &middot; {myRashi}</p>
            </div>
          </div>

          <MatchScore
            score={score}
            size="lg"
            factors={[
              { label: "Star", matched: myStar !== "—" && otherStar !== "—" },
              { label: "Rashi", matched: myRashi !== "—" && otherRashi !== "—" },
              { label: "Dosham", matched: myDosham === false && otherDosham === false },
            ]}
          />

          <div className="flex flex-col items-center gap-2">
            <Avatar name={otherName} size="xl" />
            <div className="text-center">
              <p className="text-sm font-semibold text-neutral-900">{otherName}</p>
              <p className="text-xs text-neutral-500">{otherStar} &middot; {otherRashi}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Porutham analysis */}
      <section>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          {t.horoscope.poruthamAnalysis}
        </h2>
        <HoroscopeGrid poruthams={poruthams} />
      </section>

      {/* Dosham status */}
      <Card variant="flat" padding="lg">
        <h2 className="text-lg font-semibold text-neutral-900 mb-3">{t.horoscope.doshamStatus}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500">{myName}</p>
            <p className="text-sm font-medium text-neutral-800">{doshamLabel(myDosham)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">{otherName}</p>
            <p className="text-sm font-medium text-neutral-800">{doshamLabel(otherDosham)}</p>
          </div>
        </div>
        {matchData?.doshamResult && (
          <p className="mt-3 text-sm text-neutral-600">{matchData.doshamResult}</p>
        )}
        {myDosham === false && otherDosham === false && (
          <Badge variant="success" size="lg" className="mt-3">{t.horoscope.noDoshamConcerns}</Badge>
        )}
      </Card>

      {/* Premium detailed report */}
      <PremiumUpsell feature="horoscope" />

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button
          variant="ghost"
          onClick={() => window.open(`/api/horoscope-match/${id}/pdf`, "_blank")}
        >
          <Download className="h-4 w-4" /> {t.horoscope.downloadPdf}
        </Button>
        <Button variant="ghost" onClick={() => {
          if (navigator.share) {
            navigator.share({ title: "Horoscope Match Report", url: window.location.href });
          } else {
            navigator.clipboard.writeText(window.location.href);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
          }
        }}>
          <Share2 className="h-4 w-4" /> {shareCopied ? "Link Copied!" : t.horoscope.share}
        </Button>
        <Button variant="secondary" asChild>
          <Link href={`/profile/${id}`}>{t.horoscope.backToProfile}</Link>
        </Button>
      </div>
    </div>
  );
}
