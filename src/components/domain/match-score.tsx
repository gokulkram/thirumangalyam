import { cn } from "@/lib/utils";
import { Check, X, AlertTriangle } from "lucide-react";

interface MatchScoreProps {
  score: number;
  factors?: { label: string; matched: boolean }[];
  size?: "sm" | "lg";
}

export function MatchScore({ score, factors, size = "sm" }: MatchScoreProps) {
  const label =
    score >= 80 ? "Excellent Match" : score >= 60 ? "Good Match" : score >= 40 ? "Fair Match" : "Low Match";
  const color =
    score >= 80 ? "text-success" : score >= 60 ? "text-secondary-600" : score >= 40 ? "text-warning" : "text-neutral-500";
  const bgColor =
    score >= 80 ? "stroke-success" : score >= 60 ? "stroke-secondary-500" : score >= 40 ? "stroke-warning" : "stroke-neutral-300";

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className="relative h-10 w-10">
          <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e7e5e4" strokeWidth="3" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              className={bgColor}
              strokeWidth="3"
              strokeDasharray={`${(score / 100) * 97.4} 97.4`}
              strokeLinecap="round"
            />
          </svg>
          <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", color)}>
            {score}
          </span>
        </div>
        <div>
          <p className={cn("text-xs font-semibold", color)}>{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e7e5e4" strokeWidth="2.5" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            className={bgColor}
            strokeWidth="2.5"
            strokeDasharray={`${(score / 100) * 97.4} 97.4`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold", color)}>{score}%</span>
        </div>
      </div>
      <p className={cn("text-sm font-semibold", color)}>{label}</p>

      {factors && (
        <div className="flex flex-wrap justify-center gap-2 mt-1">
          {factors.map((f) => (
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
    </div>
  );
}
