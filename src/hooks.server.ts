import type { Handle } from '@sveltejs/kit';
import { base } from '$app/paths';
import { isLocale, baseLocale } from '$lib/paraglide/runtime.js';

export const handle: Handle = ({ event, resolve }) => {
  const seg = event.url.pathname.slice(base.length).split('/')[1] ?? '';
  const lang = isLocale(seg) ? seg : baseLocale;
  return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
};
