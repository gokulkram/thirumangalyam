"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, Badge, Button } from "@/components/ui";
import { Clock, Check, X, MapPin } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import type { Interest } from "@/types";

interface InterestCardProps {
  interest: Interest;
  type: "received" | "sent" | "accepted";
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onWithdraw?: (id: string) => void;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", icon: Clock, color: "text-warning" },
  accepted: { label: "Accepted", icon: Check, color: "text-success" },
  declined: { label: "Declined", icon: X, color: "text-error" },
  expired: { label: "Expired", icon: Clock, color: "text-neutral-400" },
  withdrawn: { label: "Withdrawn", icon: X, color: "text-neutral-400" },
} as const;

export function InterestCard({
  interest,
  type,
  onAccept,
  onDecline,
  onWithdraw,
}: InterestCardProps) {
  const { t } = useTranslation();
  const { profile, status, sentAt, note } = interest;
  const statusConfig = STATUS_CONFIG[status];
  const StatusIcon = statusConfig.icon;
  const isNew = type === "received" && status === "pending";

  // Profile may be null if the other user's account was deleted
  if (!profile) {
    return (
      <div className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-50 p-4 opacity-60">
        <Avatar src="" name="?" size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500">Profile no longer available</p>
          <p className="text-xs text-neutral-400">{formatDate(new Date(sentAt))}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-[var(--radius-lg)] border border-neutral-200 bg-white p-4 transition-colors hover:bg-neutral-50",
        isNew && "border-l-[3px] border-l-primary-600"
      )}
    >
      {/* Avatar */}
      <Avatar
        src={profile.primaryPhotoUrl}
        name={profile.fullName}
        size="lg"
        showOnline={profile.isOnline}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/profile/${profile.profileId}`}
              className="text-base font-semibold text-neutral-900 hover:text-primary-600 transition-colors"
            >
              {profile.fullName}, {profile.age}
            </Link>
            <p className="text-sm text-neutral-600">{profile.occupation}</p>
            <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
              <MapPin className="h-3 w-3" />
              {profile.location}
              <span>&middot;</span>
              {profile.community}
            </div>
          </div>
          <div className="shrink-0 text-right">
            {type === "sent" && (
              <div className={cn("flex items-center gap-1 text-xs font-medium", statusConfig.color)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusConfig.label}
              </div>
            )}
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {formatDate(new Date(sentAt))}
            </p>
          </div>
        </div>

        {note && (
          <p className="mt-2 text-sm text-neutral-600 italic border-l-2 border-neutral-200 pl-3">
            &ldquo;{note}&rdquo;
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2">
          {type === "received" && status === "pending" && (
            <>
              <Button size="sm" variant="primary" onClick={() => onAccept?.(interest.id)}>
                {t.shared.accept}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDecline?.(interest.id)}>
                {t.shared.decline}
              </Button>
            </>
          )}
          {type === "sent" && status === "pending" && (
            <Button size="sm" variant="ghost" onClick={() => onWithdraw?.(interest.id)}>
              {t.shared.withdraw}
            </Button>
          )}
          {type === "accepted" && (
            <Button size="sm" variant="primary" asChild>
              <Link href={`/chat/${interest.id}`}>{t.shared.startChat}</Link>
            </Button>
          )}
          <Button size="sm" variant="text" asChild>
            <Link href={`/profile/${profile.profileId}`}>{t.shortlistPage.viewProfile}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
