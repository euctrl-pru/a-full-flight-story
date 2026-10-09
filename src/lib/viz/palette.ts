import type { AnspKey } from '$lib/story/flight';

/** EUROCONTROL Data app delay-cause names, in fixed slot order (dataviz: never cycle). */
export const CAUSES = ['Capacity/Staffing (ATC)', 'Weather', 'Aerodrome capacity', 'Disruptions (ATC)', 'Other'] as const;
export type Cause = (typeof CAUSES)[number];
export const CAUSE_LABEL: Record<Cause, string> = {
  'Capacity/Staffing (ATC)': 'ATC capacity & staffing', Weather: 'Weather', 'Aerodrome capacity': 'Airport capacity',
  'Disruptions (ATC)': 'ATC disruptions (e.g. strikes)', Other: 'Other'
};
export const CAUSE_COLOR: Record<Cause, string> = Object.fromEntries(CAUSES.map((c, i) => [c, `var(--series-${i + 1})`])) as Record<Cause, string>;

export const ANSP_COLOR: Record<AnspKey, string> = {
  skeyes: 'var(--series-1)', MUAC: 'var(--series-2)', DSNA: 'var(--series-3)', DFS: 'var(--series-4)',
  Skyguide: 'var(--series-5)', ENAV: 'var(--series-6)', ANA: 'var(--muted)'
};
export const ZONE_COLOR: Record<string, string> = { BELU: 'var(--series-1)', FR: 'var(--series-3)', DE: 'var(--series-4)', CH: 'var(--series-5)', IT: 'var(--series-6)' };

/** Current year in series-1, last year series-2, reference years muted (2020 dashed). */
export function yearStyle(year: number, current: number) {
  if (year === current) return { color: 'var(--series-1)', width: 2.5 };
  if (year === current - 1) return { color: 'var(--series-2)', width: 2 };
  return { color: 'var(--muted)', width: 1.5, dash: year === 2020 ? '4 3' : undefined };
}

/** Sequential altitude bins (ft) → --seq-300 … --seq-700 (light→dark in light theme; dark→light in dark theme). */
export const ALT_BINS = [0, 10000, 20000, 30000, 36000];
export const altitudeBin = (ft: number) => ALT_BINS.reduce((b, lo, i) => (ft >= lo ? i : b), 0);
export const ALT_VARS = ['--seq-300', '--seq-400', '--seq-500', '--seq-600', '--seq-700'];
export const cssVar = (name: string, el: Element = document.documentElement) => getComputedStyle(el).getPropertyValue(name).trim();
