"use client";

import { Logo } from "@/components/layout";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <div className="flex min-h-dvh flex-col bg-white sm:bg-neutral-50">
      {/* Header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 sm:h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <Logo />
          {isLogin ? (
            <Link
              href="/register"
              className="text-sm font-medium text-neutral-500 hover:text-primary-600 transition-colors"
            >
              New here?{" "}
              <span className="font-semibold text-primary-600">Register</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-500 hover:text-primary-600 transition-colors"
            >
              Have account?{" "}
              <span className="font-semibold text-primary-600">Login</span>
            </Link>
          )}
        </div>
      </header>

      {/* Full-screen on mobile, centered card on desktop */}
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-start sm:justify-center px-0 sm:px-4 py-0 sm:py-10"
      >
        {children}
      </main>

      <footer className="shrink-0 border-t border-neutral-100 py-3 text-center text-xs text-neutral-400">
        &copy; {new Date().getFullYear()} Thirumangalyam. All rights reserved.
      </footer>
    </div>
  );
}
