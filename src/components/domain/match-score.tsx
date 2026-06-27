"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X, ChevronDown } from "lucide-react";

export interface ScoreFactor {
  label: string;
  description?: string;
  points: number;
  maxPoints: number;
  matched: boolean;
}

interface MatchScoreProps {
  score: number;
  /** Legacy simple factors (label + matched boolean) */
  factors?: { label: string; matched: boolean }[];
  /** Rich breakdown with points */
  breakdown?: ScoreFactor[];
  size?: "sm" | "lg";
}

function scoreColor(s: number) {
  if (s >= 80) return { text: "text-success", stroke: "stroke-success", bg: "bg-success/10", border: "border-success/30" };
  if (s >= 60) return { text: "text-secondary-600", stroke: "stroke-secondary-500", bg: "bg-secondary-50", border: "border-secondary-200" };
  if (s >= 40) return { text: "text-warning", stroke: "stroke-warning", bg: "bg-amber-50", border: "border-amber-200" };
  return { text: "text-neutral-500", stroke: "stroke-neutral-300", bg: "bg-neutral-50", border: "border-neutral-200" };
}

function scoreLabel(s: number) {
  if (s >= 80) return "Excellent Match";
  if (s >= 60) return "Good Match";
  if (s >= 40) return "Fair Match";
  return "Low Match";
}

export function MatchScore({ score, factors, breakdown, size = "sm" }: MatchScoreProps) {
  const [expanded, setExpanded] = useState(false);
  const { text, stroke, bg, border } = scoreColor(score);
  const label = scoreLabel(score);

  const arc = (score / 100) * 97.4;

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className="relative h-10 w-10 shrink-0">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e7e5e4" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" className={stroke} strokeWidth="3" strokeDasharray={`${arc} 97.4`} strokeLinecap="round" />
          </svg>
          <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", text)}>{score}</span>
        </div>
        <p className={cn("text-xs font-semibold", text)}>{label}</p>
      </div>
    );
  }

  // lg — includes optional breakdown
  const showBreakdown = breakdown && breakdown.length > 0;
  const legacyFactors = factors && factors.length > 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e7e5e4" strokeWidth="2.5" />
          <circle cx="18" cy="18" r="15.5" fill="none" className={stroke} strokeWidth="2.5" strokeDasharray={`${arc} 97.4`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold", text)}>{score}%</span>
        </div>
      </div>
      <p className={cn("text-sm font-semibold", text)}>{label}</p>

      {/* Legacy simple factors */}
      {legacyFactors && !showBreakdown && (
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {factors!.map((f) => (
            <span
              key={f.label}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                f.matched ? "bg-success-light text-success" : "bg-neutral-100 text-neutral-500"
              )}
            >
              {f.matched ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {f.label}
            </span>
          ))}
        </div>
      )}

      {/* Rich breakdown */}
      {showBreakdown && (
        <div className="w-full space-y-2">
          {/* Toggle button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "w-full flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-2 text-xs font-medium transition-colors",
              bg, border, text
            )}
          >
            <span>Why this score?</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
          </button>

          {expanded && (
            <div className="rounded-[var(--radius-md)] border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
              {breakdown!.map((f) => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2">
                  <div className={cn("shrink-0 h-5 w-5 rounded-full flex items-center justify-center",
                    f.matched ? "bg-success-light" : "bg-neutral-100"
                  )}>
                    {f.matched
                      ? <Check className="h-3 w-3 text-success" />
                      : <X className="h-3 w-3 text-neutral-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs font-semibold", f.matched ? "text-neutral-900" : "text-neutral-500")}>{f.label}</p>
                    {f.description && (
                      <p className="text-[10px] text-neutral-400 truncate">{f.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-xs font-bold", f.matched ? text : "text-neutral-400")}>
                      +{f.points}
                    </p>
                    <p className="text-[10px] text-neutral-400">/{f.maxPoints}</p>
                  </div>
                </div>
              ))}

              {/* Totals row */}
              <div className={cn("flex items-center justify-between px-3 py-2.5 text-xs font-semibold", bg)}>
                <span className={text}>Total Score</span>
                <span className={text}>
                  {breakdown!.reduce((s, f) => s + f.points, 0)} / {breakdown!.reduce((s, f) => s + f.maxPoints, 0)} pts → {score}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
