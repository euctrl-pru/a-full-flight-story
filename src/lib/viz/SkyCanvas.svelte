<script lang="ts">
  import { quadtree } from 'd3';
  import type { GeoProjection } from 'd3-geo';
  import type { Aircraft } from '$lib/data/sky';
  import { ALT_VARS, altitudeBin, cssVar } from './palette';
  import Tooltip from './Tooltip.svelte';
  import { fmtInt } from './chart-utils';
  import { theme } from '$lib/ui/theme.svelte';

  let { aircraft, projection, width, height, dim = 0 }: { aircraft: Aircraft[]; projection: GeoProjection; width: number; height: number; dim?: number } = $props();
  let canvas: HTMLCanvasElement;
  let hover: { a: Aircraft; x: number; y: number } | null = $state(null);

  const pts = $derived(aircraft.flatMap((a) => { const p = projection([a.lon, a.lat]); return p ? [{ a, x: p[0], y: p[1] }] : []; }));
  const qt = $derived(quadtree<{ a: Aircraft; x: number; y: number }>().x((d) => d.x).y((d) => d.y).addAll(pts));

  $effect(() => {
    const drawnTheme = theme.current; // re-run on theme toggle: the ramp is read from CSS variables
    if (!canvas || !width || !height) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    const colors = ALT_VARS.map((v) => cssVar(v));
    ctx.globalAlpha = 1 - dim * 0.8;
    for (const { a, x, y } of pts) {
      ctx.fillStyle = colors[altitudeBin(a.alt)];
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
    canvas.dataset.drawnTheme = drawnTheme;
  });

  function onmove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const f = qt.find(e.clientX - r.left, e.clientY - r.top, 12);
    hover = f ?? null;
  }
</script>

<canvas bind:this={canvas} style:width="{width}px" style:height="{height}px" onpointermove={onmove} onpointerleave={() => (hover = null)} aria-hidden="true"></canvas>
<Tooltip visible={!!hover} x={hover?.x ?? 0} y={hover?.y ?? 0} containerWidth={width}>
  {#if hover}<strong>{hover.a.cs || hover.a.id}</strong><div class="row">FL{Math.round(hover.a.alt / 100)}<span class="v">{fmtInt(hover.a.gs)} kt</span></div>{/if}
</Tooltip>

<style>
  canvas { position: absolute; inset: 0; touch-action: pan-y; }
</style>
