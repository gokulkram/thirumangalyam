"use client";

import { Mail, Phone, MessageCircle, Search } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Card,
  Input,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui";

const CATEGORIES = [
  {
    title: "Account & Registration",
    faqs: [
      {
        q: "How do I create an account?",
        a: "Click 'Register' on the homepage, choose whether you're registering for yourself or as a parent/guardian, fill in your details, verify your phone with OTP, and complete the onboarding steps.",
      },
      {
        q: "Can I register on behalf of my son/daughter?",
        a: "Yes! Select 'Parent/Guardian' during registration. You'll get a dedicated parent dashboard to manage your child's profile and review matches.",
      },
      {
        q: "How do I verify my profile?",
        a: "Go to Settings and upload a government-issued ID (Aadhaar, PAN, Passport). Our team reviews and verifies within 24-48 hours.",
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: "Click 'Forgot Password' on the login page. You'll receive an OTP on your registered phone number to reset your password.",
      },
    ],
  },
  {
    title: "Matches & Search",
    faqs: [
      {
        q: "How are matches calculated?",
        a: "We use a combination of your partner preferences, community compatibility, location proximity, education/occupation alignment, and horoscope matching (10-point Porutham system).",
      },
      {
        q: "Why am I seeing limited matches?",
        a: "Free accounts see up to 10 matches per day. Upgrade to Premium for unlimited matches. You can also broaden your partner preferences for more results.",
      },
      {
        q: "Can I search by specific community?",
        a: "Yes. Use the Advanced Search filters to search by community, sub-community, gothra, and other cultural criteria.",
      },
    ],
  },
  {
    title: "Premium Membership",
    faqs: [
      {
        q: "What do I get with Premium?",
        a: "Unlimited matches, direct chat, contact detail access, full horoscope reports, profile boost, who-viewed-me, and priority support.",
      },
      {
        q: "Is there auto-renewal?",
        a: "No. All our plans are one-time payments with no auto-renewal. You choose when to renew.",
      },
      {
        q: "Can I get a refund?",
        a: "We offer a 7-day money-back guarantee if you're not satisfied. Contact support within 7 days of purchase.",
      },
    ],
  },
  {
    title: "Privacy & Safety",
    faqs: [
      {
        q: "Who can see my profile?",
        a: "Only registered and logged-in members can view profiles. You can further control visibility in Settings > Privacy — hide from specific users or show only to premium members.",
      },
      {
        q: "How do I report a fake profile?",
        a: "Visit the profile and click 'Report'. Select the reason and our moderation team will review within 24 hours.",
      },
      {
        q: "How do I block someone?",
        a: "Go to their profile and click the 'Block' button. They won't be able to see your profile or contact you anymore.",
      },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    faqs: cat.faqs.filter(
      (f) =>
        !search ||
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.faqs.length > 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900">
          Help Center
        </h1>
        <p className="mt-3 text-neutral-500">
          Find answers to common questions or reach out to our support team.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Search for help..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* FAQ sections */}
      {filtered.map((cat) => (
        <div key={cat.title}>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">
            {cat.title}
          </h2>
          <Accordion type="single" collapsible>
            {cat.faqs.map((faq, i) => (
              <AccordionItem key={i} value={`${cat.title}-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-neutral-500">
          No results found for &quot;{search}&quot;. Try a different search or contact us below.
        </p>
      )}

      {/* Contact */}
      <Card variant="flat" padding="lg">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 text-center">
          Still Need Help?
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 text-center text-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Mail className="h-4 w-4" />
            </div>
            <span className="font-medium text-neutral-700">Email</span>
            <span className="text-neutral-500">support@thirumangalyam.com</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <Phone className="h-4 w-4" />
            </div>
            <span className="font-medium text-neutral-700">Phone</span>
            <span className="text-neutral-500">+91 44 2345 6789</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span className="font-medium text-neutral-700">WhatsApp</span>
            <span className="text-neutral-500">+91 98765 43210</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
