import { base } from '$app/paths';
import type { Locale } from '$lib/paraglide/runtime.js';
export const LOCALES: { code: Locale; name: string }[] = [
  { code: 'en', name: 'English' }, { code: 'de', name: 'Deutsch' }, { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' }, { code: 'es', name: 'Español' }, { code: 'pl', name: 'Polski' }
];
export const localeHref = (l: Locale) => (l === 'en' ? `${base}/` : `${base}/${l}/`);
