import { intlLocale } from '$lib/i18n/msg';

const nfCache = new Map<string, Intl.NumberFormat>();
const nf = (opts: Intl.NumberFormatOptions = {}) => {
  const key = intlLocale() + JSON.stringify(opts);
  if (!nfCache.has(key)) nfCache.set(key, new Intl.NumberFormat(intlLocale(), opts));
  return nfCache.get(key)!;
};
export const fmtInt = (n: number) => nf({ maximumFractionDigits: 0 }).format(Math.round(n));
export const fmtDec = (n: number, d = 1) => nf({ minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const utc = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);
export const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(utc(iso));
/** Medium date + short time in UTC (callers append the localized "UTC"). */
export const fmtDateTime = (iso: string | number | Date) =>
  new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(iso));
export const fmtHm = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/** Day-of-year label in a non-leap year (series are re-dated onto the current year). */
export const doyLabel = (doy: number) =>
  new Intl.DateTimeFormat(intlLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, doy)));
export function roundedTopBar(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
export function nearestIndex(xs: number[], x: number): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  return best;
}
