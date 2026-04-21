import { CheckCircle, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types";

interface VerifiedBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "md";
}

const BADGE_CONFIG = {
  verified: {
    icon: CheckCircle,
    label: "Verified",
    classes: "bg-success-light text-success",
  },
  pending: {
    icon: Clock,
    label: "Pending Verification",
    classes: "bg-warning-light text-warning",
  },
  unverified: {
    icon: Shield,
    label: "Not Verified",
    classes: "bg-neutral-100 text-neutral-500",
  },
} as const;

export function VerifiedBadge({ status, size = "md" }: VerifiedBadgeProps) {
  const config = BADGE_CONFIG[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.classes,
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {config.label}
    </span>
  );
}
