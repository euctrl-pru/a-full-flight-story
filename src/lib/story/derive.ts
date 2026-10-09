import type { EntityBundle } from '$lib/data/eurocontrol';
import { dayOfYear, yearOfSeries, stackByName } from '$lib/data/series';
import { CAUSES, CAUSE_COLOR, CAUSE_SHORT, yearStyle } from '$lib/viz/palette';
import { fmtDate } from '$lib/viz/chart-utils';
import type { Bar, LineSeries, TableSpec } from '$lib/viz/types';

export const dayNum = (iso: string) => Math.round(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / 86_400_000);
export const dayNumLabel = (n: number) => fmtDate(new Date(n * 86_400_000).toISOString());

export function trafficLines(b: EntityBundle | undefined, years = [2019, 2025, 2026], current = 2026): LineSeries[] {
  return (b?.traffic ?? [])
    .filter((s) => s.chartType === 'daily_evolution')
    .map((s) => ({ s, yr: yearOfSeries(s) }))
    .filter((d): d is { s: (typeof d)['s']; yr: number } => d.yr !== null && years.includes(d.yr))
    .sort((a, b) => a.yr - b.yr)
    .map(({ s, yr }) => ({ id: String(yr), label: String(yr), ...yearStyle(yr, current), points: s.points.map((p) => ({ x: dayOfYear(p.date), y: p.value })) }));
}

const FORECAST_STYLE: Record<string, Partial<LineSeries>> = {
  Actual: { color: 'var(--series-1)', width: 2.5 }, Base: { color: 'var(--series-2)', width: 2 },
  High: { color: 'var(--muted)', width: 1.5, dash: '4 3' }, Low: { color: 'var(--muted)', width: 1.5, dash: '4 3' }
};
export function forecastLines(b: EntityBundle | undefined): LineSeries[] {
  return (b?.traffic ?? [])
    .filter((s) => s.chartType === 'forecast' && s.name in FORECAST_STYLE)
    .map((s) => ({ id: s.name, label: s.name === 'Actual' ? 'Actual' : `${s.name} forecast`, color: '', ...FORECAST_STYLE[s.name], points: s.points.map((p) => ({ x: +p.date.slice(0, 4), y: p.value / 1e6 })) }));
}

export function causeRows(b: EntityBundle | undefined, range = 'Y2D') {
  return stackByName((b?.delay ?? []).filter((s) => s.chartType === 'category_evolution' && s.dateRange === range), [...CAUSES])
    .map((r) => ({ x: dayOfYear(r.date), values: r.values }));
}

export function causeBars(b: EntityBundle | undefined): Bar[] {
  return CAUSES.map((c) => {
    const s = (b?.delay ?? []).find((x) => x.chartType === 'category_evolution' && x.dateRange === 'DY' && x.name === c);
    return { key: c, label: CAUSE_SHORT[c], value: s?.points.at(-1)?.value ?? 0, color: CAUSE_COLOR[c] };
  });
}

export function punctualityLines(b: EntityBundle | undefined, days = 365): LineSeries[] {
  const style = [{ color: 'var(--series-1)', width: 2 }, { color: 'var(--series-2)', width: 2 }];
  return ['Departure punct.', 'Arrival punct.'].flatMap((name, i) => {
    const s = (b?.punctuality ?? []).find((x) => x.chartType === 'evo_chart' && x.name === name);
    return s ? [{ id: name, label: name.replace(' punct.', ' punctuality'), ...style[i], points: s.points.slice(-days).map((p) => ({ x: dayNum(p.date), y: p.value })) }] : [];
  });
}

export function co2Lines(b: EntityBundle | undefined): LineSeries[] {
  const style = [{ color: 'var(--series-1)', width: 2 }, { color: 'var(--series-2)', width: 2 }];
  return ['CO2 index', 'Departures index'].flatMap((name, i) => {
    const s = (b?.co2 ?? []).find((x) => x.chartType === 'evo_chart' && x.name === name);
    return s ? [{ id: name, label: name.replace('CO2', 'CO₂'), ...style[i], points: s.points.map((p) => ({ x: dayNum(p.date), y: p.value })) }] : [];
  });
}

export function linesTable(lines: LineSeries[], xLabel: string, xFormat: (x: number) => string, yFormat: (y: number) => string, caption: string): TableSpec {
  const xs = [...new Set(lines.flatMap((l) => l.points.map((p) => p.x)))].sort((a, b) => a - b);
  const maps = lines.map((l) => new Map(l.points.map((p) => [p.x, p.y])));
  return {
    caption,
    columns: [{ key: 'x', label: xLabel }, ...lines.map((l) => ({ key: l.id, label: l.label }))],
    rows: xs.map((x) => ({ x: xFormat(x), ...Object.fromEntries(lines.map((l, i) => [l.id, maps[i].has(x) ? yFormat(maps[i].get(x)!) : ''])) }))
  };
}
