import type { ParamMatcher } from '@sveltejs/kit';
import { isLocale, baseLocale } from '$lib/paraglide/runtime.js';
/** Only the non-base locales get a URL prefix; English lives at the root. */
export const match: ParamMatcher = (p) => isLocale(p) && p !== baseLocale;
