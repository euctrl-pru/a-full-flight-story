<script lang="ts">
  import type { GeoProjection, GeoPath } from 'd3-geo';
  import { pointAtKm, routeLengthKm, sliceRoute, type LonLat, type Span } from '$lib/geo/route';
  import { ANSP_LABEL, type AnspKey } from '$lib/story/flight';
  import { ANSP_COLOR } from './palette';
  import { MILITARY_AREAS, REGULATED_SECTOR } from '$lib/story/airspace';

  type R = { id: string; coords: LonLat[]; spans?: Span<AnspKey>[]; style: 'active' | 'ghost' | 'alt' };
  let { projection, path, routes, progress = 1, showAnsp = false, military = false, regulated = false, showPlane = true, width = Infinity }: {
    projection: GeoProjection; path: GeoPath; routes: R[]; progress?: number; showAnsp?: boolean; military?: boolean; regulated?: boolean; showPlane?: boolean; width?: number;
  } = $props();

  const line = (c: LonLat[]) => path({ type: 'LineString', coordinates: c }) ?? '';
  const active = $derived(routes.find((r) => r.style === 'active'));
  const L = $derived(active ? routeLengthKm(active.coords) : 0);
  const plane = $derived.by(() => {
    if (!active) return null;
    const d = Math.max(0.5, Math.min(L - 0.5, progress * L));
    const p = projection(pointAtKm(active.coords, d).lonlat);
    const q = projection(pointAtKm(active.coords, Math.min(L, d + 3)).lonlat);
    if (!p || !q) return null;
    return { x: p[0], y: p[1], angle: (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI };
  });
</script>

{#if military}
  {#each MILITARY_AREAS as f, i (i)}<path class="mil" d={path(f)} />{/each}
{/if}
{#if regulated}<path class="reg" d={path(REGULATED_SECTOR)} />{/if}

{#each routes as r (r.id)}
  {#if r.style !== 'active'}
    <path class="route {r.style}" d={line(r.coords)} />
  {:else if showAnsp && r.spans}
    {#each r.spans as s (s.id + s.startKm)}
      {#if s.startKm < progress * L}
        <path class="route seg" style:stroke={ANSP_COLOR[s.id]} d={line(sliceRoute(r.coords, s.startKm, Math.min(s.endKm, progress * L)))} />
      {/if}
      {@const mid = projection(pointAtKm(r.coords, (s.startKm + s.endKm) / 2).lonlat)}
      {#if mid && s.startKm < progress * L}
        {@const flip = mid[0] > width * 0.55}
        <text class="lbl" x={mid[0] + (flip ? -10 : 10)} y={mid[1]} text-anchor={flip ? 'end' : 'start'}>{ANSP_LABEL[s.id]}</text>
      {/if}
    {/each}
  {:else}
    <path class="route active" d={line(sliceRoute(r.coords, 0, Math.max(1, progress * L)))} />
  {/if}
{/each}

{#if showPlane && plane}
  <g transform="translate({plane.x},{plane.y}) rotate({plane.angle + 90})" class="plane" aria-hidden="true">
    <path d="M0,-11 L2,-4 L10,1 L10,3 L2,1 L1.5,7 L4,9 L4,10.5 L0,9.5 L-4,10.5 L-4,9 L-1.5,7 L-2,1 L-10,3 L-10,1 L-2,-4 Z" />
  </g>
{/if}

<style>
  .route { fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .route.active { stroke: var(--ink); stroke-width: 2.5; }
  .route.seg { stroke-width: 3.5; }
  .route.ghost { stroke: var(--muted); stroke-width: 1.5; stroke-dasharray: 4 4; }
  .route.alt { stroke: var(--series-4); stroke-width: 2; stroke-dasharray: 6 4; }
  .mil { fill: color-mix(in srgb, var(--status-serious) 18%, transparent); stroke: var(--status-serious); stroke-dasharray: 3 3; }
  .reg { fill: color-mix(in srgb, var(--status-critical) 22%, transparent); stroke: var(--status-critical); stroke-width: 1.5; }
  .lbl { fill: var(--ink); font-size: 12px; paint-order: stroke; stroke: var(--bg); stroke-width: 3px; }
  .plane path { fill: var(--ink); stroke: var(--bg); stroke-width: 1; }
</style>
