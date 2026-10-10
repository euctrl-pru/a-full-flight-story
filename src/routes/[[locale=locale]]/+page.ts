import { locales, baseLocale, overwriteGetLocale, type Locale } from '$lib/paraglide/runtime.js';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => locales.filter((l) => l !== baseLocale).map((locale) => ({ locale }));

export const load: PageLoad = ({ params }) => {
  const locale = (params.locale ?? baseLocale) as Locale;
  overwriteGetLocale(() => locale); // SvelteKit prerenders one page at a time (prerender.concurrency = 1)
  return { locale };
};
