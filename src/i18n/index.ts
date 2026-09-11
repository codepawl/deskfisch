import { vi } from "./vi";

/**
 * Tiny string table. Keys are the English copy itself, so code stays readable
 * and a missing translation falls back to English. `{name}` placeholders are
 * filled from `params`.
 */
export type Lang = "en" | "vi";
export const LANGS: Record<Lang, string> = { en: "English", vi: "Tiếng Việt" };

const tables: Record<Lang, Record<string, string>> = { en: {}, vi };
let current: Lang = "en";

export function detectLang(): Lang {
  return navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en";
}

export function setLang(lang: Lang): void {
  current = lang;
  document.documentElement.lang = lang;
}

export function currentLang(): Lang {
  return current;
}

export function t(key: string, params?: Record<string, string | number>): string {
  let s = tables[current][key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
