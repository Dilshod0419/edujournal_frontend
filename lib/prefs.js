// Til va tema: brauzer xotirasida (localStorage) saqlanadi va barcha komponentlarga
// useSyncExternalStore orqali yetkaziladi (hydration xatosisiz).

export const LANGS = ["uz", "ru", "en"];
export const THEMES = ["light", "dark"];

const DEFAULT = Object.freeze({ lang: "uz", theme: "light" });

let state = DEFAULT;
let loaded = false;
const listeners = new Set();

function applyToDocument(s) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", s.theme === "dark");
  document.documentElement.lang = s.lang;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  let lang = "uz";
  let theme = null;
  try {
    const l = localStorage.getItem("lang");
    if (LANGS.includes(l)) lang = l;
    theme = localStorage.getItem("theme");
  } catch {
    /* localStorage mavjud emas */
  }
  if (!THEMES.includes(theme)) {
    theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  state = Object.freeze({ lang, theme });
  applyToDocument(state);
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot() {
  load();
  return state;
}

export function getServerSnapshot() {
  return DEFAULT;
}

export function setPrefs(partial) {
  load();
  const next = {
    lang: LANGS.includes(partial.lang) ? partial.lang : state.lang,
    theme: THEMES.includes(partial.theme) ? partial.theme : state.theme,
  };
  if (next.lang === state.lang && next.theme === state.theme) return;
  state = Object.freeze(next);
  try {
    localStorage.setItem("lang", state.lang);
    localStorage.setItem("theme", state.theme);
  } catch {
    /* ignore */
  }
  applyToDocument(state);
  listeners.forEach((l) => l());
}
