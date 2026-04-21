import Link from "next/link";
import { Logo } from "./logo";
import { Shield, CheckCircle, Users } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      {/* Trust strip */}
      {/* <div className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-8 px-4 py-6 md:px-8 lg:px-20">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Shield className="h-5 w-5 text-success" />
            <span>Photos Verified</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <CheckCircle className="h-5 w-5 text-success" />
            <span>Aadhaar ID Checked</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Users className="h-5 w-5 text-primary-500" />
            <span>50,000+ Profiles</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Heart className="h-5 w-5 text-primary-500" />
            <span>1,200+ Marriages</span>
          </div>
        </div>
      </div> */}

      {/* Main footer */}
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-8 lg:px-20">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-3 text-sm text-neutral-500 max-w-xs">
              Trusted South Indian matrimonial service connecting families with tradition and technology.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-3">Company</h4>
            <ul className="space-y-2">
              {[
                { label: "About Us", href: "/how-it-works" },
                { label: "Success Stories", href: "/success-stories" },
                { label: "Blog", href: "/success-stories" },
                { label: "Careers", href: "/how-it-works" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-3">Support</h4>
            <ul className="space-y-2">
              {[
                { label: "Help Center", href: "/help" },
                { label: "Contact Us", href: "/help" },
                { label: "Safety Tips", href: "/help" },
                { label: "Report Abuse", href: "/help" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-neutral-800 mb-3">Legal</h4>
            <ul className="space-y-2">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "Cookie Policy", href: "/privacy" },
                { label: "Refund Policy", href: "/terms" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-neutral-500 hover:text-primary-600 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} Thirumangalyam. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export function MinimalFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white py-4">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-4 px-4 text-xs text-neutral-400">
        <Link href="/help" className="hover:text-neutral-600 transition-colors">Help</Link>
        <span>&middot;</span>
        <Link href="/privacy" className="hover:text-neutral-600 transition-colors">Privacy</Link>
        <span>&middot;</span>
        <Link href="/terms" className="hover:text-neutral-600 transition-colors">Terms</Link>
        <span>&middot;</span>
        <span>&copy; {new Date().getFullYear()} Thirumangalyam</span>
      </div>
    </footer>
  );
}

function Heart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
