"use client";

import { createContext, useContext } from "react";
import en from "./en";
import ta from "./ta";
import type { Translations } from "./en";

export type Locale = "en" | "ta";

export const translations: Record<Locale, Translations> = { en, ta };

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  ta: "தமிழ்",
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

export const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

export function useTranslation() {
  return useContext(I18nContext);
}

export type { Translations };
