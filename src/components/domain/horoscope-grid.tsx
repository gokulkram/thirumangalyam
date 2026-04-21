import { cn } from "@/lib/utils";
import { Check, X, AlertTriangle } from "lucide-react";
import type { Porutham } from "@/types";

interface HoroscopeGridProps {
  poruthams: Porutham[];
}

export function HoroscopeGrid({ poruthams }: HoroscopeGridProps) {
  return (
    <div className="divide-y divide-neutral-200 rounded-[var(--radius-lg)] border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto] gap-4 bg-neutral-50 px-4 py-3">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Porutham</span>
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Result</span>
      </div>

      {poruthams.map((p) => (
        <div key={p.name} className="grid grid-cols-[1fr_auto] gap-4 px-4 py-3 items-center">
          <div>
            <p className="text-sm font-medium text-neutral-800">{p.name}</p>
            <p className="text-xs text-neutral-500">{p.tamilName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {p.isCompatible === true && (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="text-sm font-medium text-success">Compatible</span>
              </>
            )}
            {p.isCompatible === false && (
              <>
                <X className="h-4 w-4 text-error" />
                <span className="text-sm font-medium text-error">Not Compatible</span>
              </>
            )}
            {p.isCompatible === "partial" && (
              <>
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">Partial</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
