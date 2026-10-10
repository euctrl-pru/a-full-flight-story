import type { Freshness } from '$lib/data/live';
import { msg } from '$lib/i18n/msg';
import { minutesAgo } from '$lib/data/sky';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const utcDay = (d: Date) => d.toISOString().slice(0, 10);

export function fmtDayShort(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

export function dayPhrase(dataDate: string | null | undefined, now = new Date()): string {
  if (!dataDate) return 'on the latest day available';
  const today = utcDay(now);
  const yesterday = utcDay(new Date(now.getTime() - 86_400_000));
  if (dataDate === yesterday) return `yesterday (${fmtDayShort(dataDate)})`;
  if (dataDate === today) return `today (${fmtDayShort(dataDate)})`;
  return `on ${fmtDayShort(dataDate)}`;
}

export const livePhrase = (f: Freshness | null) => (f === 'live' ? 'fetched live' : 'from the latest snapshot');
export const currentYear = (dataDate?: string | null, now = new Date()) => (dataDate ? +dataDate.slice(0, 4) : now.getUTCFullYear());

export function ageLabel(iso: string, now = Date.now()): string {
  const m = minutesAgo(iso, now);
  if (m < 60) return msg('ui_age_min', { n: m });
  if (m < 48 * 60) return m % 60 ? msg('ui_age_hm', { h: Math.floor(m / 60), m: m % 60 }) : msg('ui_age_h', { h: Math.floor(m / 60) });
  return msg('ui_age_days', { n: Math.floor(m / 1440) });
}
