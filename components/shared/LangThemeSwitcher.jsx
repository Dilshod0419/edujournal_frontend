"use client";

import { Moon, Sun } from "lucide-react";
import api from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { LANGS } from "@/lib/prefs";
import { cn } from "@/lib/utils";

/** Til (UZ / RU / EN) va tema (light / dark) tugmalari. Tanlov profilga ham saqlanadi. */
export default function LangThemeSwitcher({ className }) {
  const { lang, theme, setLang, setTheme } = useI18n();

  const sync = (patch) => {
    if (typeof window !== "undefined" && localStorage.getItem("token")) {
      api.put("/auth/preferences", patch).catch(() => {});
    }
  };

  const changeLang = (value) => {
    setLang(value);
    sync({ language: value });
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    sync({ theme: next });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="group" aria-label="language">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => changeLang(l)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-bold uppercase transition",
              lang === l
                ? "bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <button
        onClick={toggleTheme}
        className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
        aria-label="theme"
        title={theme === "dark" ? "Light" : "Dark"}
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
