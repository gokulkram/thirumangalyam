import Link from "next/link";
import { Lock, Crown, MessageSquare, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui";

interface PremiumUpsellProps {
  feature: "chat" | "contact" | "viewedMe" | "horoscope" | "general";
}

const UPSELL_CONFIG = {
  chat: {
    icon: MessageSquare,
    title: "Upgrade to Chat",
    description: "Start conversations with your mutual matches. Premium members can chat directly.",
  },
  contact: {
    icon: Lock,
    title: "Unlock Contact Details",
    description: "View phone numbers and contact information of your accepted matches.",
  },
  viewedMe: {
    icon: Eye,
    title: "See Who Viewed You",
    description: "Find out who's interested — see everyone who visited your profile.",
  },
  horoscope: {
    icon: Star,
    title: "Detailed Horoscope Report",
    description: "Get comprehensive star compatibility analysis with planetary positions and remedies.",
  },
  general: {
    icon: Crown,
    title: "Go Premium",
    description: "Unlimited matches, chat, contact details, and much more.",
  },
};

export function PremiumUpsell({ feature }: PremiumUpsellProps) {
  const config = UPSELL_CONFIG[feature];
  const Icon = config.icon;

  return (
    <div className="rounded-[var(--radius-lg)] premium-gradient p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
        <Icon className="h-6 w-6 text-secondary-400" />
      </div>
      <h3 className="text-lg font-semibold text-white">{config.title}</h3>
      <p className="mt-1 text-sm text-neutral-400 max-w-xs mx-auto">{config.description}</p>
      <Button variant="premium" size="md" className="mt-4" asChild>
        <Link href="/premium">See Premium Plans</Link>
      </Button>
    </div>
  );
}
