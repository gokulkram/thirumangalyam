"use client";

import { useTranslation, LOCALE_LABELS, type Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  const toggle = () => {
    setLocale(locale === "en" ? "ta" : "en");
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 rounded-full border-2 border-primary-600 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100 transition-colors shadow-sm",
        className
      )}
      title={locale === "en" ? "தமிழில் மாற்று" : "Switch to English"}
    >
      <Languages className="h-4 w-4" />
      <span>{LOCALE_LABELS[locale === "en" ? "ta" : "en"]}</span>
    </button>
  );
}

/** Floating language button — always visible bottom-right on all pages */
export function FloatingLanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  const toggle = () => {
    setLocale(locale === "en" ? "ta" : "en");
  };

  return (
    <button
      onClick={toggle}
      className="fixed bottom-20 lg:bottom-6 right-4 z-[500] flex items-center gap-2 rounded-full bg-primary-600 text-white px-5 py-3 text-sm font-bold shadow-lg hover:bg-primary-700 transition-colors"
      title={locale === "en" ? "தமிழில் மாற்று" : "Switch to English"}
    >
      <Languages className="h-5 w-5" />
      <span>{locale === "en" ? "தமிழ்" : "English"}</span>
    </button>
  );
}
