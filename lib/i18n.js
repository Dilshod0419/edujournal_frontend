"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getServerSnapshot, getSnapshot, setPrefs, subscribe } from "@/lib/prefs";
import uz from "@/lib/locales/uz";
import ru from "@/lib/locales/ru";
import en from "@/lib/locales/en";

const dictionaries = { uz, ru, en };

export const LOCALES = { uz: "uz-UZ", ru: "ru-RU", en: "en-GB" };

export function translate(lang, key, vars) {
  let text = dictionaries[lang]?.[key] ?? dictionaries.uz[key] ?? key;
  if (vars) {
    text = text.replace(/\{(\w+)\}/g, (_, name) => (vars[name] ?? ""));
  }
  return text;
}

export function useI18n() {
  const { lang, theme } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);
  return {
    t,
    lang,
    theme,
    locale: LOCALES[lang],
    setLang: (value) => setPrefs({ lang: value }),
    setTheme: (value) => setPrefs({ theme: value }),
  };
}
