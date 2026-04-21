import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Protected app routes — redirect to login if not authenticated
  const protectedPaths = [
    "/dashboard",
    "/profile",
    "/search",
    "/chat",
    "/interests",
    "/shortlist",
    "/who-viewed-me",
    "/horoscope-match",
    "/settings",
    "/premium",
    "/checkout",
    "/onboarding",
    "/parent-dashboard",
  ];

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // Admin routes (exclude /admin-login itself to avoid redirect loop)
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin-login";

  if (isAdminRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin-login", req.url));
  }

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // If logged in and visiting login/register, redirect to appropriate dashboard
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    const isAdmin = (req.auth?.user as any)?.isAdmin;
    return NextResponse.redirect(new URL(isAdmin ? "/admin/dashboard" : "/dashboard", req.url));
  }

  // If logged in as admin and visiting admin-login, redirect to admin dashboard
  if (isLoggedIn && pathname === "/admin-login") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/search/:path*",
    "/chat/:path*",
    "/interests/:path*",
    "/shortlist/:path*",
    "/who-viewed-me/:path*",
    "/horoscope-match/:path*",
    "/settings/:path*",
    "/premium/:path*",
    "/checkout/:path*",
    "/onboarding/:path*",
    "/parent-dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/admin-login",
  ],
};
