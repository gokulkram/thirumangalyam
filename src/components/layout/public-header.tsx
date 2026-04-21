"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";
import { useTranslation } from "@/lib/i18n";

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const NAV_LINKS = [
    { href: "/how-it-works", label: t.nav.howItWorks },
    { href: "/success-stories", label: t.nav.successStories },
    { href: "/premium", label: t.nav.plans },
  ];

  return (
    <header className="sticky top-0 z-[300] border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8 lg:px-20">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop auth buttons + language */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">{t.common.login}</Link>
          </Button>
          <Button variant="primary" size="sm" asChild>
            <Link href="/register">{t.common.signUp}</Link>
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-2 text-neutral-700 hover:bg-neutral-100 rounded-[var(--radius-md)]"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <nav className="flex flex-col px-4 py-4 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-md)] px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-neutral-200 pt-4">
              <div className="flex justify-center mb-2">
                <LanguageSwitcher />
              </div>
              <Button variant="ghost" fullWidth asChild>
                <Link href="/login">{t.common.login}</Link>
              </Button>
              <Button variant="primary" fullWidth asChild>
                <Link href="/register">{t.common.signUpFree}</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
