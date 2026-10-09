import { describe, it, expect } from 'vitest';
import { slotTimes, allocateSlots, withinSlotWindow, type CasaFlight } from '$lib/sim/casa';
import { mulberry32, generateDemand, hourlyCounts } from '$lib/sim/demand';

const reg = { id: 'LFEEX1', start: 300, end: 540, rate: 28 };

describe('slotTimes', () => {
  it('reproduces the ATFCM manual example: 4 h at 28/h = 112 slots ~2 min apart [S7]', () => {
    const s = slotTimes(reg);
    expect(s.length).toBe(112);
    expect(s[1] - s[0]).toBeCloseTo(60 / 28, 6);
  });
});

describe('allocateSlots', () => {
  const mk = (n: number, every: number, start = 300): CasaFlight[] =>
    Array.from({ length: n }, (_, i) => ({ id: `F${i}`, eto: start + i * every, etot: start + i * every - 30 }));

  it('gives no delay when demand is under capacity', () => {
    expect(allocateSlots(mk(20, 5), reg).every((a) => a.delay === 0)).toBe(true);
  });
  it('queues first-planned first-served when demand doubles capacity', () => {
    const a = allocateSlots(mk(56, 60 / 56), reg);
    const entries = a.map((x) => x.entry);
    for (let i = 1; i < entries.length; i++) expect(entries[i]).toBeGreaterThan(entries[i - 1]);
    for (let i = 1; i < a.length; i++) expect(a[i].delay).toBeGreaterThanOrEqual(a[i - 1].delay - 1);
    // 56 flights in one hour need two hours of 28/h slots: the last one waits ≈ 59 min
    expect(a.at(-1)!.delay).toBeGreaterThan(55);
    expect(a.at(-1)!.delay).toBeLessThan(62);
    expect(new Set(a.map((x) => x.slotIndex)).size).toBe(a.length);
  });
  it('leaves flights outside the regulation untouched and keeps input order', () => {
    const f = [{ id: 'late', eto: 600, etot: 570 }, { id: 'in', eto: 310, etot: 280 }];
    const a = allocateSlots(f, reg);
    expect(a.map((x) => x.id)).toEqual(['late', 'in']);
    expect(a[0]).toMatchObject({ regulated: false, delay: 0, ctot: 570, slotIndex: null });
    expect(a[1]).toMatchObject({ regulated: true, delay: 0 });
  });
  it('ctot = etot + delay', () => {
    for (const x of allocateSlots(mk(56, 60 / 56), reg)) expect(x.ctot).toBe(x.eto - 30 + x.delay);
  });
});

describe('slot window', () => {
  it('is −5/+10 minutes around CTOT [S7]', () => {
    expect(withinSlotWindow(317, 322)).toBe(true);
    expect(withinSlotWindow(316, 322)).toBe(false);
    expect(withinSlotWindow(332, 322)).toBe(true);
    expect(withinSlotWindow(333, 322)).toBe(false);
  });
});

describe('demand', () => {
  it('is deterministic for a seed', () => {
    const cfg = { seed: 7, from: 240, to: 600, baseRate: 24, peakRate: 46, peakAt: 360, peakWidth: 60 };
    expect(generateDemand(cfg)).toEqual(generateDemand(cfg));
    expect(mulberry32(1)()).toBe(mulberry32(1)());
  });
  it('produces sorted flights inside the window and a peak', () => {
    const f = generateDemand({ seed: 3, from: 240, to: 600, baseRate: 20, peakRate: 50, peakAt: 360, peakWidth: 45 });
    expect(f.every((x) => x.eto >= 240 && x.eto < 600)).toBe(true);
    const bins = hourlyCounts(f, 240, 600);
    expect(bins.length).toBe(6);
    const peak = bins.reduce((m, b) => (b.count > m.count ? b : m));
    expect(peak.start).toBeGreaterThanOrEqual(300);
    expect(peak.start).toBeLessThanOrEqual(360);
  });
});
