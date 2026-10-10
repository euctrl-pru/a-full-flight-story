import { HERO } from './flight';
import type { AtmPhase } from './types';

export const EOBT_ISO = `${HERO.date}T${HERO.std}:00Z`;
const EOBT_MS = Date.parse(EOBT_ISO);
const DAY0_H = -(+HERO.std.slice(0, 2) + +HERO.std.slice(3, 5) / 60); // midnight of D, in hours from EOBT

export const hoursFromEobt = (iso: string) => (Date.parse(iso) - EOBT_MS) / 3_600_000;
export const scaleHours = (h: number) => Math.sign(h) * Math.log10(1 + Math.abs(h));
export const timeScale = (iso: string) => scaleHours(hoursFromEobt(iso));

export const TIME_TICKS = [
  { label: '−10 mo', h: -7300 }, { label: '−1 mo', h: -720 }, { label: '−1 wk', h: -168 }, { label: 'D−1', h: -24 },
  { label: 'EOBT', h: 0 }, { label: '+2 h', h: 2 }, { label: '+1 d', h: 24 }, { label: '+1 yr', h: 8760 }
];

/** Phase boundaries in scale units: pre-tactical D−6 00:00, tactical D 00:00, post-ops D+1 00:00. */
export function phaseSpans(): { id: AtmPhase; from: number; to: number }[] {
  const b = [-7400, DAY0_H - 6 * 24, DAY0_H, DAY0_H + 24, 9000].map(scaleHours);
  const ids: AtmPhase[] = ['strategic', 'pretactical', 'tactical', 'postops'];
  return ids.map((id, i) => ({ id, from: b[i], to: b[i + 1] }));
}

/** Where each chapter sits on the timeline (its first characteristic event). */
export const CHAPTER_ANCHORS: Record<string, string> = {
  strategic: 'schedule', airspace: 'season-start', 'week-before': 'adp', filing: 'fpl', twist: 'sam',
  reroute: 'rrp', ground: 'ground-start', enroute: 'muac', arrival: 'aldt', postops: 'postops'
};
