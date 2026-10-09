<script lang="ts">
  import type { ZoneCharge } from '$lib/sim/charges';
  import { ZONE_COLOR } from './palette';
  import { fmtInt } from './chart-utils';
  let { planned, rerouted, mode }: { planned: ZoneCharge[]; rerouted: ZoneCharge[]; mode: 'distance' | 'cost' | 'compare' } = $props();
  const SHORT: Record<string, string> = { BELU: 'BE-LU', FR: 'FR', DE: 'DE', CH: 'CH', IT: 'IT' };
  const sum = (z: ZoneCharge[], k: 'km' | 'charge') => z.reduce((s, x) => s + x[k], 0);
  const rows = $derived([
    ...(mode !== 'cost' ? [{ id: 'pd', label: 'Planned · distance', zones: planned, k: 'km' as const, unit: 'km' }] : []),
    ...(mode !== 'distance' ? [{ id: 'pc', label: 'Planned · charges', zones: planned, k: 'charge' as const, unit: '€' }] : []),
    ...(mode === 'compare' ? [{ id: 'rc', label: 'Rerouted · charges', zones: rerouted, k: 'charge' as const, unit: '€' }] : [])
  ]);
  const maxTotal = $derived(Math.max(...rows.filter((r) => r.k === 'charge').map((r) => sum(r.zones, 'charge')), 1));
</script>

<div class="charges">
  {#each rows as r (r.id)}
    {@const total = sum(r.zones, r.k)}
    <div class="row">
      <div class="lbl">{r.label} <span class="tot">{r.unit === '€' ? `€${fmtInt(total)}` : `${fmtInt(total)} km`}</span></div>
      <div class="track" style:width={r.k === 'charge' ? `${(total / maxTotal) * 100}%` : '100%'}>
        {#each r.zones as z (z.zone.id)}
          {@const share = z[r.k] / total}
          <div class="seg" style:flex-grow={share} style:background={ZONE_COLOR[z.zone.id]} title="{z.zone.label}: {r.unit === '€' ? `€${fmtInt(z.charge)}` : `${fmtInt(z.km)} km`} ({Math.round(share * 100)}%)">
            {#if share > 0.09}<span>{SHORT[z.zone.id] ?? z.zone.id} {Math.round(share * 100)}%</span>{/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
  <table class="visually-hidden"><caption>Route charges by zone</caption><thead><tr><th>Route</th><th>Zone</th><th>km</th><th>€</th></tr></thead>
    <tbody>{#each [{ n: 'Planned', zs: planned }, { n: 'Rerouted', zs: rerouted }] as g (g.n)}{#each g.zs as z (z.zone.id)}<tr><td>{g.n}</td><td>{z.zone.label}</td><td>{z.km}</td><td>{z.charge}</td></tr>{/each}{/each}</tbody></table>
</div>

<style>
  .charges { display: flex; flex-direction: column; gap: 14px; padding: 16px; width: 100%; }
  .lbl { font-size: 13px; color: var(--ink-2); margin-bottom: 4px; } .tot { color: var(--ink); font-weight: 650; margin-left: 6px; }
  .track { display: flex; gap: 2px; height: 34px; transition: width 500ms; }
  .seg { min-width: 2px; border-radius: 4px; display: flex; align-items: center; padding: 0 6px; overflow: hidden; transition: flex-grow 500ms; }
  .seg span { font-size: 11px; font-weight: 650; color: #fff; white-space: nowrap; text-shadow: 0 1px 2px rgb(0 0 0 / 0.5); }
</style>
