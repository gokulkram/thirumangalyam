import { Logo } from "@/components/layout";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-secondary">
      {/* Minimal header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Logo />
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors"
          >
            Already a member? <span className="text-primary-600">Login</span>
          </Link>
        </div>
      </header>

      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="py-4 text-center text-xs text-neutral-400">
        &copy; {new Date().getFullYear()} Thirumangalyam. All rights reserved.
      </footer>
    </div>
  );
}
