"use client";

import Link from "next/link";
import { UserPlus, SlidersHorizontal, Heart, MessageSquare, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui";

const STEPS = [
  {
    icon: UserPlus,
    title: "Create Your Profile",
    description:
      "Sign up and build a detailed profile with your personal, family, and horoscope details. Add verified photos and let your personality shine through.",
  },
  {
    icon: SlidersHorizontal,
    title: "Set Your Preferences",
    description:
      "Tell us what you're looking for — community, education, location, horoscope compatibility, and more. Our filters ensure relevant matches.",
  },
  {
    icon: Heart,
    title: "Get Quality Matches",
    description:
      "Receive curated matches based on your preferences, community alignment, and horoscope compatibility scores powered by traditional Jothidam calculations.",
  },
  {
    icon: MessageSquare,
    title: "Connect & Chat",
    description:
      "Express interest, and once it's mutual, start chatting securely. Premium members can view contact details and initiate direct conversations.",
  },
  {
    icon: CalendarHeart,
    title: "Meet & Begin Your Journey",
    description:
      "Arrange meetings with your families' blessings. Over 1,200 successful marriages and counting — your story could be next.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-16">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900">
          How Thirumangalyam Works
        </h1>
        <p className="mt-3 text-neutral-500 max-w-lg mx-auto">
          Finding your life partner, the traditional way — with modern convenience.
        </p>
      </div>

      {/* Steps */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-primary-100 hidden md:block" />

        <div className="space-y-12">
          {STEPS.map((step, i) => (
            <div key={i} className="relative flex items-start gap-6">
              <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-md">
                <step.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Step {i + 1}: {step.title}
                </h3>
                <p className="mt-1 text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900">
          Ready to Find Your Match?
        </h2>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild>
            <Link href="/register">Create Free Profile</Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/plans">View Premium Plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
