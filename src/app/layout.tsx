import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui";
import { ToastProvider, ToastViewport } from "@/components/ui";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { FloatingLanguageSwitcher } from "@/components/layout/language-switcher";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Thirumangalyam — South Indian Matrimony",
    template: "%s | Thirumangalyam",
  },
  description:
    "Trusted South Indian matrimonial service. Find your life partner the traditional way, made simple. 50,000+ verified profiles.",
  keywords: [
    "South Indian matrimony",
    "Tamil matrimony",
    "Telugu matrimony",
    "Kannada matrimony",
    "Malayalam matrimony",
    "Indian marriage",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <SessionProvider>
          <I18nProvider>
            <TooltipProvider>
              <ToastProvider swipeDirection="right">
                {children}
                <FloatingLanguageSwitcher />
                <ToastViewport />
              </ToastProvider>
            </TooltipProvider>
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
