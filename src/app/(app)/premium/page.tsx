"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Badge,
  Card,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui";
import { PlanCard } from "@/components/domain";
import { PREMIUM_PLANS } from "@/lib/constants";
import { Check, X, Shield, CreditCard, Users } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("premium_6");
  const router = useRouter();
  const { t } = useTranslation();

  const FEATURES = [
    { name: t.premium.dailyMatches, free: "10", premium: t.premium.unlimited },
    { name: t.premium.expressInterest, free: "5" + t.premium.perDay, premium: t.premium.unlimited },
    { name: t.premium.viewContactDetails, free: false, premium: true },
    { name: t.premium.chatWithMatches, free: false, premium: true },
    { name: t.premium.whoViewedProfile, free: t.premium.blurred, premium: t.premium.fullAccess },
    { name: t.premium.advancedFilters, free: t.premium.basicFilters, premium: t.premium.allFilters },
    { name: t.premium.horoscopeMatching, free: t.premium.basicReport, premium: t.premium.detailedReport },
    { name: t.premium.profileBoost, free: false, premium: t.premium.perWeek },
    { name: t.premium.prioritySupport, free: false, premium: true },
  ];

  const FAQS = [
    { q: t.premium.faq1Q, a: t.premium.faq1A },
    { q: t.premium.faq2Q, a: t.premium.faq2A },
    { q: t.premium.faq3Q, a: t.premium.faq3A },
    { q: t.premium.faq4Q, a: t.premium.faq4A },
  ];

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center">
        <Badge variant="premium" size="lg" className="mb-3">{t.common.premium}</Badge>
        <h1 className="text-3xl font-bold text-neutral-900">{t.premium.title}</h1>
        <p className="mt-2 text-neutral-500 max-w-md mx-auto">
          {t.premium.subtitle}
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-3xl mx-auto">
        {PREMIUM_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan === plan.id}
            onSelect={setSelectedPlan}
          />
        ))}
      </div>

      {/* Proceed button */}
      <div className="text-center">
        <Button
          variant="primary"
          size="lg"
          className="px-12 text-base"
          onClick={() => router.push(`/checkout?plan=${selectedPlan}`)}
        >
          Proceed to Pay — &#8377;{(PREMIUM_PLANS.find((p) => p.id === selectedPlan)?.totalPrice || 0).toLocaleString("en-IN")}
        </Button>
        <p className="mt-2 text-xs text-neutral-400">Secure payment via Razorpay &middot; UPI &amp; Cards accepted</p>
      </div>

      {/* Feature comparison */}
      <Card variant="flat" padding="lg" className="max-w-3xl mx-auto">
        <h2 className="text-lg font-semibold text-neutral-900 mb-6 text-center">{t.premium.featureComparison}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-3 text-left font-semibold text-neutral-700">{t.premium.feature}</th>
                <th className="py-3 text-center font-semibold text-neutral-700 w-28">{t.common.free}</th>
                <th className="py-3 text-center font-semibold text-primary-700 w-28">{t.common.premium}</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.name} className="border-b border-neutral-100">
                  <td className="py-3 text-neutral-700">{f.name}</td>
                  <td className="py-3 text-center">
                    {typeof f.free === "boolean" ? (
                      f.free ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-neutral-300 mx-auto" />
                    ) : (
                      <span className="text-neutral-500">{f.free}</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {typeof f.premium === "boolean" ? (
                      f.premium ? <Check className="h-4 w-4 text-success mx-auto" /> : <X className="h-4 w-4 text-neutral-300 mx-auto" />
                    ) : (
                      <span className="font-medium text-primary-700">{f.premium}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Trust elements */}
      <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-600">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary-500" />
          {t.premium.trustedFamilies}
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-success" />
          {t.premium.securePayments}
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-neutral-500" />
          {t.premium.noAutoRenewal} &middot; {t.premium.cancelAnytime}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4 text-center">
          {t.premium.faq}
        </h2>
        <Accordion type="single" collapsible>
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{faq.q}</AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
