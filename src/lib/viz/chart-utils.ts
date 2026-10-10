import { intlLocale } from '$lib/i18n/msg';

// Intl formatters are expensive to construct (and these run per bar/tick/tooltip): build once per locale + options.
const fmtCache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
function cached<T extends Intl.NumberFormat | Intl.DateTimeFormat>(kind: string, make: (locale: string) => T): T {
  const locale = intlLocale();
  const key = `${kind}|${locale}`;
  let f = fmtCache.get(key);
  if (!f) fmtCache.set(key, (f = make(locale)));
  return f as T;
}
const nfInt = () => cached('int', (l) => new Intl.NumberFormat(l, { maximumFractionDigits: 0 }));
const nfDec = (d: number) => cached(`dec${d}`, (l) => new Intl.NumberFormat(l, { minimumFractionDigits: d, maximumFractionDigits: d }));
export const fmtInt = (n: number) => nfInt().format(Math.round(n));
export const fmtDec = (n: number, d = 1) => nfDec(d).format(n);
const utc = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`);
export const fmtDate = (iso: string) =>
  cached('date', (l) => new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })).format(utc(iso));
/** Medium date + short time in UTC (callers append the localized "UTC"). */
export const fmtDateTime = (iso: string | number | Date) =>
  cached('datetime', (l) => new Intl.DateTimeFormat(l, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })).format(new Date(iso));
export const fmtHm = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
/** Day-of-year label in a non-leap year (series are re-dated onto the current year). */
export const doyLabel = (doy: number) =>
  cached('doy', (l) => new Intl.DateTimeFormat(l, { day: 'numeric', month: 'short', timeZone: 'UTC' })).format(new Date(Date.UTC(2026, 0, doy)));
export function roundedTopBar(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}
export function nearestIndex(xs: number[], x: number): number {
  let best = 0;
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i;
  return best;
}
