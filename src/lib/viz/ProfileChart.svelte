<script lang="ts">
  import { scaleLinear, area as d3area } from 'd3';
  import { altitudeAtKm, ANSP_LABEL, type AnspKey } from '$lib/story/flight';
  import { routeLengthKm, type LonLat, type Span } from '$lib/geo/route';
  import { ANSP_COLOR } from './palette';
  import { fmtInt } from './chart-utils';

  let { route, spans, progress }: { route: LonLat[]; spans: Span<AnspKey>[]; progress: number } = $props();
  let width = $state(0);
  const height = 200, m = { t: 16, r: 16, b: 28, l: 56 };
  const L = $derived(routeLengthKm(route));
  const pts = $derived(Array.from({ length: 241 }, (_, i) => (i / 240) * L).map((d) => ({ d, alt: altitudeAtKm(d, L) })));
  const x = $derived(scaleLinear().domain([0, L]).range([m.l, Math.max(m.l + 1, width - m.r)]));
  const y = $derived(scaleLinear().domain([0, 40000]).range([height - m.b, m.t]));
  const gen = $derived(d3area<{ d: number; alt: number }>().x((p) => x(p.d)).y0(height - m.b).y1((p) => y(p.alt)));
</script>

<div class="profile" bind:clientWidth={width}>
  {#if width}
    <svg {width} {height} role="img" aria-label="Vertical profile of FFS101 coloured by the controlling ANSP">
      {#each spans as s (s.id + s.startKm)}
        <path d={gen(pts.filter((p) => p.d >= s.startKm && p.d <= s.endKm && p.d <= progress * L))} fill={ANSP_COLOR[s.id]} opacity="0.85" />
      {/each}
      <line class="fl" x1={m.l} x2={width - m.r} y1={y(24500)} y2={y(24500)} />
      <text class="flt" x={width - m.r} y={y(24500) - 4} text-anchor="end">FL245 — above: MUAC over Benelux</text>
      {#each [0, 10000, 20000, 30000, 40000] as t}<text class="tick" x={m.l - 6} y={y(t)} dy="0.32em" text-anchor="end">{t === 0 ? '0' : `FL${t / 100}`}</text>{/each}
      {#each [0, 300, 600, 900, 1200].filter((k) => k <= L) as k}<text class="tick" x={x(k)} y={height - 8} text-anchor="middle">{fmtInt(k)} km</text>{/each}
    </svg>
    <ul class="legend">{#each spans as s (s.id + s.startKm)}<li><span class="sw" style:background={ANSP_COLOR[s.id]}></span>{ANSP_LABEL[s.id]}</li>{/each}</ul>
  {/if}
</div>

<style>
  .profile { width: 100%; }
  svg { display: block; }
  .fl { stroke: var(--ink-2); stroke-dasharray: 4 4; } .flt { fill: var(--ink-2); font-size: 11px; }
  .tick { fill: var(--muted); font-size: 11px; }
  .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; list-style: none; padding: 0; margin: 6px 0 0; font-size: 12px; color: var(--ink-2); }
  .sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 5px; }
</style>
