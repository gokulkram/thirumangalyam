"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, X, MapPin, CheckCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";
import type { MatchCard } from "@/types";

interface ProfileCardProps {
  profile: MatchCard;
  onShortlist?: (id: string) => void;
  onSkip?: (id: string) => void;
  variant?: "default" | "compact";
}

export function ProfileCard({
  profile,
  onShortlist,
  onSkip,
  variant = "default",
}: ProfileCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-lg)] border border-neutral-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        variant === "compact" && "flex flex-row"
      )}
    >
      {/* Photo */}
      <div
        className={cn(
          "relative overflow-hidden bg-neutral-100",
          variant === "default" ? "aspect-[3/4]" : "h-32 w-28 shrink-0"
        )}
      >
        {profile.primaryPhotoUrl ? (
          <Image
            src={profile.primaryPhotoUrl}
            alt={profile.fullName}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-neutral-200 text-neutral-400">
            <span className="text-4xl font-bold">
              {profile.fullName.charAt(0)}
            </span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {profile.isVerified && (
            <Badge variant="success" size="sm">
              <CheckCircle className="h-3 w-3" />
              Verified
            </Badge>
          )}
          {profile.isPremium && (
            <Badge variant="premium" size="sm">
              <Star className="h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>

        {/* Online indicator */}
        {profile.isOnline && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Online
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={cn("flex flex-col", variant === "default" ? "p-4" : "flex-1 p-3 justify-between")}>
        <div>
          <h3 className="text-base font-semibold text-neutral-900 truncate">
            {profile.fullName}, {profile.age}
          </h3>
          <p className="text-sm text-neutral-600 truncate">{profile.occupation}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
            <MapPin className="h-3 w-3" />
            <span>{profile.location}</span>
            <span className="mx-1">&middot;</span>
            <span>{profile.community}</span>
          </div>

          {profile.compatibilityScore !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full",
                    profile.compatibilityScore >= 80
                      ? "bg-success"
                      : profile.compatibilityScore >= 60
                      ? "bg-secondary-500"
                      : "bg-warning"
                  )}
                  style={{ width: `${profile.compatibilityScore}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-neutral-600">
                {profile.compatibilityScore}%
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={cn("flex items-center gap-2", variant === "default" ? "mt-3" : "mt-2")}>
          <Button variant="secondary" size="sm" className="flex-1" asChild>
            <Link href={`/profile/${profile.profileId}`}>View Profile</Link>
          </Button>
          <button
            onClick={() => onShortlist?.(profile.id)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 transition-colors",
              profile.isShortlisted
                ? "bg-primary-50 border-primary-200 text-primary-600"
                : "text-neutral-400 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200"
            )}
            aria-label={profile.isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
          >
            <Heart
              className="h-4 w-4"
              fill={profile.isShortlisted ? "currentColor" : "none"}
            />
          </button>
          {onSkip && (
            <button
              onClick={() => onSkip(profile.id)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-400 hover:bg-neutral-100 transition-colors"
              aria-label="Not interested"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
