import type { Series } from './eurocontrol';

export function dayOfYear(date: string): number {
  const d = Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10));
  return Math.round((d - Date.UTC(+date.slice(0, 4), 0, 1)) / 86_400_000) + 1;
}

export function yearOfSeries(s: Series): number | null {
  const m = s.name.match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

export function stackByName(series: Series[], order: string[]) {
  const byDate = new Map<string, Record<string, number>>();
  for (const s of series) {
    if (!order.includes(s.name)) continue;
    for (const p of s.points) {
      const row = byDate.get(p.date) ?? Object.fromEntries(order.map((n) => [n, 0]));
      row[s.name] = p.value;
      byDate.set(p.date, row);
    }
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, values }));
}
