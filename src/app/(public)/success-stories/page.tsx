"use client";

import Link from "next/link";
import { Heart, Quote } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

const STORIES = [
  {
    couple: "Priya & Karthik",
    community: "Iyer",
    location: "Chennai",
    married: "March 2025",
    quote:
      "We matched on horoscope compatibility and our families connected instantly. Thirumangalyam made the whole process so respectful and smooth.",
    initials: ["P", "K"],
  },
  {
    couple: "Lakshmi & Surya",
    community: "Mudaliar",
    location: "Coimbatore",
    married: "January 2025",
    quote:
      "As a parent registering for my daughter, I found the parent dashboard incredibly helpful. We found the perfect match within two months!",
    initials: ["L", "S"],
  },
  {
    couple: "Meena & Raj",
    community: "Nadar",
    location: "Madurai",
    married: "November 2024",
    quote:
      "The verified profiles gave us confidence. We knew every profile was genuine, which made the entire experience trustworthy.",
    initials: ["M", "R"],
  },
  {
    couple: "Divya & Arun",
    community: "Chettiar",
    location: "Trichy",
    married: "September 2024",
    quote:
      "The horoscope matching feature was spot on! Our families were amazed at the 32-point compatibility score. Truly a modern take on tradition.",
    initials: ["D", "A"],
  },
  {
    couple: "Sangeetha & Venkat",
    community: "Iyengar",
    location: "Bangalore",
    married: "July 2024",
    quote:
      "Living abroad, we wanted a partner from our community. Thirumangalyam's detailed filters helped us find each other across continents.",
    initials: ["S", "V"],
  },
  {
    couple: "Anitha & Prakash",
    community: "Gounder",
    location: "Salem",
    married: "May 2024",
    quote:
      "The chat feature let us talk freely before involving families. By the time we met in person, we already knew we were right for each other.",
    initials: ["A", "P"],
  },
];

export default function SuccessStoriesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="text-center">
        <Badge variant="premium" size="lg" className="mb-3">
          <Heart className="h-3 w-3" /> 1,200+ Marriages
        </Badge>
        <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900">
          Success Stories
        </h1>
        <p className="mt-3 text-neutral-500 max-w-lg mx-auto">
          Real couples who found their life partners through Thirumangalyam.
        </p>
      </div>

      {/* Stories grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {STORIES.map((story) => (
          <Card key={story.couple} variant="flat" padding="lg" className="flex flex-col">
            {/* Couple avatars */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {story.initials.map((initial, i) => (
                <div
                  key={i}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-lg font-bold"
                >
                  {initial}
                </div>
              ))}
            </div>

            <h3 className="text-center font-semibold text-neutral-900">
              {story.couple}
            </h3>
            <p className="text-center text-xs text-neutral-500 mt-1">
              {story.community} &middot; {story.location} &middot; Married {story.married}
            </p>

            <div className="mt-4 flex-1">
              <Quote className="h-4 w-4 text-primary-300 mb-1" />
              <p className="text-sm text-neutral-600 italic leading-relaxed">
                {story.quote}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900">
          Your Story Could Be Next
        </h2>
        <Button size="lg" asChild>
          <Link href="/register">Start Your Journey</Link>
        </Button>
      </div>
    </div>
  );
}
