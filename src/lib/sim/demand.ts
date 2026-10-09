import type { CasaFlight } from './casa';

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DemandConfig { seed: number; from: number; to: number; baseRate: number; peakRate: number; peakAt: number; peakWidth: number }

/** Non-homogeneous Poisson arrivals (per hour) at the sector via thinning; Gaussian peak. */
export function generateDemand(cfg: DemandConfig): CasaFlight[] {
  const rnd = mulberry32(cfg.seed);
  const rate = (t: number) => cfg.baseRate + (cfg.peakRate - cfg.baseRate) * Math.exp(-0.5 * ((t - cfg.peakAt) / cfg.peakWidth) ** 2);
  const max = Math.max(cfg.baseRate, cfg.peakRate);
  const out: CasaFlight[] = [];
  let t = cfg.from;
  while (true) {
    t += (-Math.log(1 - rnd()) / max) * 60;
    if (t >= cfg.to) break;
    if (rnd() <= rate(t) / max) {
      const eto = Math.round(t * 10) / 10;
      out.push({ id: `F${String(out.length + 1).padStart(3, '0')}`, eto, etot: Math.round(eto - 20 - rnd() * 25) });
    }
  }
  return out;
}

export function hourlyCounts(flights: { eto: number }[], from: number, to: number, binMin = 60) {
  const bins = Array.from({ length: Math.ceil((to - from) / binMin) }, (_, i) => ({ start: from + i * binMin, count: 0 }));
  for (const f of flights) {
    const i = Math.floor((f.eto - from) / binMin);
    if (i >= 0 && i < bins.length) bins[i].count++;
  }
  return bins;
}
