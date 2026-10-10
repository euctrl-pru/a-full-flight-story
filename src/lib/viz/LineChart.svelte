<script lang="ts">
  import { scaleLinear, line as d3line, max, min } from 'd3';
  import type { LineSeries, XY } from './types';
  import Tooltip from './Tooltip.svelte';
  import Legend from './Legend.svelte';
  import { nearestIndex, fmtInt } from './chart-utils';

  let { series, label, height = 300, xDomain, yDomain, xTicks, yTicks = 5, xFormat = (x: number) => String(x),
    yFormat = (y: number) => fmtInt(y), reveal = 1, markers = [], directLabels = true, xTickWidth = 80 }: {
    series: LineSeries[]; label: string; height?: number; xDomain?: [number, number]; yDomain?: [number, number];
    xTicks?: number[]; yTicks?: number; xFormat?: (x: number) => string; yFormat?: (y: number) => string;
    reveal?: number; markers?: { x: number; label: string }[]; directLabels?: boolean; xTickWidth?: number;
  } = $props();

  const uid = $props.id();
  let width = $state(0);
  const m = { top: 12, right: 72, bottom: 26, left: 52 };
  const all = $derived(series.flatMap((s) => s.points));
  const xd = $derived(xDomain ?? ([min(all, (p) => p.x) ?? 0, max(all, (p) => p.x) ?? 1] as [number, number]));
  const yd = $derived(yDomain ?? ([0, (max(all, (p) => p.y) ?? 1) * 1.05] as [number, number]));
  const x = $derived(scaleLinear().domain(xd).range([m.left, Math.max(m.left + 1, width - m.right)]));
  const y = $derived(scaleLinear().domain(yd).nice().range([height - m.bottom, m.top]));
  const gen = $derived(d3line<XY>().x((p) => x(p.x)).y((p) => y(p.y)).defined((p) => Number.isFinite(p.y)));
  const clipW = $derived(m.left + (width - m.left - m.right) * Math.max(0, Math.min(1, reveal)) + 1);
  let hoverX: number | null = $state(null);
  const rows = $derived(
    hoverX === null ? [] : series.flatMap((s) => {
      const p = s.points[nearestIndex(s.points.map((q) => q.x), hoverX!)];
      return p ? [{ s, p }] : [];
    })
  );
  function onmove(e: PointerEvent) {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    hoverX = px < m.left || px > width - m.right ? null : x.invert(px);
  }
</script>

<div class="chart" bind:clientWidth={width}>
  {#if series.length > 1}<Legend items={series.map((s) => ({ label: s.label, color: s.color, dash: s.dash }))} />{/if}
  {#if width > 0}
    <svg {width} {height} role="img" aria-label={label} onpointermove={onmove} onpointerleave={() => (hoverX = null)}>
      <defs><clipPath id="clip-{uid}"><rect x="0" y="0" width={clipW} {height} /></clipPath></defs>
      {#each y.ticks(yTicks) as t}
        <line class="grid" x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={m.left - 6} y={y(t)} dy="0.32em" text-anchor="end">{yFormat(t)}</text>
      {/each}
      {#each xTicks ?? x.ticks(Math.max(2, Math.floor(width / xTickWidth))) as t}<text class="tick" x={x(t)} y={height - 6} text-anchor="middle">{xFormat(t)}</text>{/each}
      <line class="axis" x1={m.left} x2={width - m.right} y1={y(y.domain()[0])} y2={y(y.domain()[0])} />
      {#each markers as mk}
        <line class="marker" x1={x(mk.x)} x2={x(mk.x)} y1={m.top} y2={height - m.bottom} />
        <text class="mtext" x={x(mk.x) + 4} y={m.top + 10}>{mk.label}</text>
      {/each}
      <g clip-path="url(#clip-{uid})">
        {#each series as s (s.id)}
          <path d={gen(s.points)} fill="none" stroke={s.color} stroke-width={s.width ?? 2} stroke-dasharray={s.dash} stroke-linejoin="round" stroke-linecap="round" />
        {/each}
      </g>
      {#if directLabels && series.length <= 4 && reveal >= 1 && width >= 600}
        {#each series as s (s.id)}
          {@const last = s.points.at(-1)}
          {#if last}<text class="dl" x={x(last.x) + 6} y={y(last.y)} dy="0.32em">{s.label}</text>{/if}
        {/each}
      {/if}
      {#if rows.length}
        <line class="cross" x1={x(rows[0].p.x)} x2={x(rows[0].p.x)} y1={m.top} y2={height - m.bottom} />
        {#each rows as r (r.s.id)}<circle cx={x(r.p.x)} cy={y(r.p.y)} r="4" fill={r.s.color} stroke="var(--surface)" stroke-width="2" />{/each}
      {/if}
    </svg>
  {/if}
  <Tooltip visible={rows.length > 0} x={rows.length ? x(rows[0].p.x) : 0} y={m.top} containerWidth={width}>
    <strong>{rows.length ? xFormat(rows[0].p.x) : ''}</strong>
    {#each rows as r (r.s.id)}<div class="row"><span class="sw" style:background={r.s.color}></span>{r.s.label}<span class="v">{yFormat(r.p.y)}</span></div>{/each}
  </Tooltip>
</div>

<style>
  .chart { position: relative; width: 100%; }
  svg { display: block; overflow: visible; touch-action: pan-y; }
  .grid { stroke: var(--grid); stroke-width: 1; }
  .axis { stroke: var(--axis); }
  .tick, .mtext { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
  .dl { fill: var(--ink-2); font-size: 12px; }
  .marker { stroke: var(--axis); stroke-dasharray: 2 3; }
  .cross { stroke: var(--ink-2); stroke-width: 1; }
</style>
