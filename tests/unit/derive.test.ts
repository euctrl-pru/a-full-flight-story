import { describe, it, expect } from 'vitest';
import traffic from '../fixtures/eurocontrol/traffic_charts-network.json';
import delay from '../fixtures/eurocontrol/delay_charts-network.json';
import punct from '../fixtures/eurocontrol/punctualities_charts-network.json';
import co2 from '../fixtures/eurocontrol/co2_charts-network.json';
import { parseCharts, type EntityBundle } from '$lib/data/eurocontrol';
import { trafficLines, forecastLines, causeRows, causeBars, punctualityLines, co2Lines, linesTable, dayNum, dayNumLabel } from '$lib/story/derive';
import { CAUSES } from '$lib/viz/palette';

const b: EntityBundle = {
  key: 'network', label: 'European network', syncId: 1, dataDate: '2026-10-08',
  traffic: parseCharts(traffic), delay: parseCharts(delay), punctuality: parseCharts(punct), co2: parseCharts(co2),
  headline: { flights: 1, delayMinutes: 1, delayPerFlight: 1 }
};

describe('derive', () => {
  it('traffic lines: 2019, 2025, 2026 with the current year drawn last', () => {
    const l = trafficLines(b);
    expect(l.map((s) => s.id)).toEqual(['2019', '2025', '2026']);
    expect(l[2].color).toBe('var(--series-1)');
    for (const p of l[0].points) { expect(p.x).toBeGreaterThanOrEqual(1); expect(p.x).toBeLessThanOrEqual(366); }
  });
  it('forecast in million flights per year', () => {
    const f = forecastLines(b);
    expect(f.map((s) => s.id).sort()).toEqual(['Actual', 'Base', 'High', 'Low']);
    const actual = f.find((s) => s.id === 'Actual')!;
    expect(actual.points[0].x).toBe(2019);
    expect(actual.points.at(-1)!.y).toBeGreaterThan(8);
    expect(actual.points.at(-1)!.y).toBeLessThan(15);
  });
  it('cause rows and bars use the fixed cause order', () => {
    const rows = causeRows(b);
    expect(rows.length).toBeGreaterThan(30);
    expect(Object.keys(rows[0].values)).toEqual([...CAUSES]);
    const bars = causeBars(b);
    expect(bars.map((x) => x.key)).toEqual([...CAUSES]);
    expect(bars.every((x) => x.value >= 0)).toBe(true);
  });
  it('punctuality and CO₂ lines', () => {
    expect(punctualityLines(b).map((s) => s.id)).toEqual(['Departure punct.', 'Arrival punct.']);
    expect(punctualityLines(b, 30)[0].points.length).toBeLessThanOrEqual(30);
    expect(co2Lines(b).map((s) => s.id)).toEqual(['CO2 index', 'Departures index']);
  });
  it('dayNum round-trips', () => {
    expect(dayNumLabel(dayNum('2026-10-08'))).toBe('8 Oct 2026');
  });
  it('linesTable aligns series by x', () => {
    const t = linesTable([
      { id: 'a', label: 'A', color: '', points: [{ x: 1, y: 10 }, { x: 2, y: 20 }] },
      { id: 'b', label: 'B', color: '', points: [{ x: 2, y: 5 }] }
    ], 'Day', String, String, 'cap');
    expect(t.rows).toEqual([{ x: '1', a: '10', b: '' }, { x: '2', a: '20', b: '5' }]);
    expect(t.columns.map((c) => c.label)).toEqual(['Day', 'A', 'B']);
  });
});
