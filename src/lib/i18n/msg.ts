import { m } from '$lib/paraglide/messages.js';
import { getLocale, overwriteGetLocale, type Locale } from '$lib/paraglide/runtime.js';

type MsgFn = (params?: Record<string, unknown>) => string;
const table = m as unknown as Record<string, MsgFn>;

export function msg(key: string, params?: Record<string, unknown>): string {
  const fn = table[key];
  if (typeof fn !== 'function') throw new Error(`Missing message ${key}`);
  return fn(params ?? {});
}
export const has = (key: string) => typeof table[key] === 'function';
export const keyOf = (id: string) => id.replace(/[^A-Za-z0-9]/g, '_');
export const intlLocale = (l: Locale = getLocale()) => (l === 'en' ? 'en-GB' : l);

/** Run `fn` with the locale pinned (tests and build-time code). */
export function withLocale<T>(l: Locale, fn: () => T): T {
  overwriteGetLocale(() => l);
  try { return fn(); } finally { overwriteGetLocale(() => 'en'); }
}
