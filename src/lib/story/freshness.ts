import type { Freshness } from '$lib/data/live';
import { msg, intlLocale } from '$lib/i18n/msg';
import { minutesAgo } from '$lib/data/sky';

const utcDay = (d: Date) => d.toISOString().slice(0, 10);

const dayFmt = new Map<string, Intl.DateTimeFormat>();
export function fmtDayShort(iso: string): string {
  const l = intlLocale();
  let f = dayFmt.get(l);
  if (!f) dayFmt.set(l, (f = new Intl.DateTimeFormat(l, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })));
  return f.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)).replace(',', '');
}

export function dayPhrase(dataDate: string | null | undefined, now = new Date()): string {
  if (!dataDate) return msg('fresh_unknown');
  const today = utcDay(now);
  const yesterday = utcDay(new Date(now.getTime() - 86_400_000));
  const date = fmtDayShort(dataDate);
  if (dataDate === yesterday) return msg('fresh_yesterday', { date });
  if (dataDate === today) return msg('fresh_today', { date });
  return msg('fresh_on', { date });
}

export const livePhrase = (f: Freshness | null) => msg(f === 'live' ? 'live_live' : 'live_snapshot');
export const currentYear = (dataDate?: string | null, now = new Date()) => (dataDate ? +dataDate.slice(0, 4) : now.getUTCFullYear());

export function ageLabel(iso: string, now = Date.now()): string {
  const m = minutesAgo(iso, now);
  if (m < 60) return msg('ui_age_min', { n: m });
  if (m < 48 * 60) return m % 60 ? msg('ui_age_hm', { h: Math.floor(m / 60), m: m % 60 }) : msg('ui_age_h', { h: Math.floor(m / 60) });
  return msg('ui_age_days', { n: Math.floor(m / 1440) });
}
