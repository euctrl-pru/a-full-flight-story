import { locales, baseLocale, type Locale } from '$lib/paraglide/runtime.js';

/** First supported non-English language the browser prefers, or null when English (or nothing supported) comes first. */
export function preferredSupported(languages: readonly string[]): Locale | null {
  for (const tag of languages) {
    const l = tag.toLowerCase().split('-')[0];
    if (l === baseLocale) return null;
    if ((locales as readonly string[]).includes(l)) return l as Locale;
  }
  return null;
}
