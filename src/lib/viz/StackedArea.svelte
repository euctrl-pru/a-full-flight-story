<script lang="ts">
  import { scaleLinear, stack, area, curveMonotoneX, max } from 'd3';
  import { msg } from '$lib/i18n/msg';
  import Tooltip from './Tooltip.svelte';
  import Legend from './Legend.svelte';
  import { nearestIndex, fmtInt } from './chart-utils';

  type Row = { x: number; values: Record<string, number> };
  let { rows, keys, colors, labels, label, height = 300, xFormat = (x: number) => String(x), yFormat = (y: number) => fmtInt(y), xTicks, reveal = 1 }: {
    rows: Row[]; keys: string[]; colors: Record<string, string>; labels: Record<string, string>; label: string;
    height?: number; xFormat?: (x: number) => string; yFormat?: (y: number) => string; xTicks?: number[]; reveal?: number;
  } = $props();

  const uid = $props.id();
  let width = $state(0);
  const m = { top: 10, right: 16, bottom: 26, left: 56 };
  const layers = $derived(stack<Row>().keys(keys).value((d, k) => d.values[k] ?? 0)(rows));
  const x = $derived(scaleLinear().domain([rows[0]?.x ?? 0, rows.at(-1)?.x ?? 1]).range([m.left, Math.max(m.left + 1, width - m.right)]));
  const y = $derived(scaleLinear().domain([0, (max(layers.at(-1) ?? [], (d) => d[1]) ?? 1) * 1.05]).nice().range([height - m.bottom, m.top]));
  const gen = $derived(area<[number, number] & { data: Row }>().x((d) => x(d.data.x)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(curveMonotoneX));
  const clipW = $derived(m.left + (width - m.left - m.right) * Math.max(0, Math.min(1, reveal)) + 1);
  let hi: number | null = $state(null);
  function onmove(e: PointerEvent) {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - r.left;
    hi = px < m.left || px > width - m.right ? null : nearestIndex(rows.map((d) => d.x), x.invert(px));
  }
  const total = (r: Row) => keys.reduce((s, k) => s + (r.values[k] ?? 0), 0);
</script>

<div class="chart" bind:clientWidth={width}>
  <Legend items={keys.map((k) => ({ label: labels[k], color: colors[k] }))} />
  {#if width > 0}
    <svg {width} {height} role="img" aria-label={label} onpointermove={onmove} onpointerleave={() => (hi = null)}>
      <defs><clipPath id="clip-{uid}"><rect x="0" y="0" width={clipW} {height} /></clipPath></defs>
      {#each y.ticks(5) as t}
        <line class="grid" x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={m.left - 6} y={y(t)} dy="0.32em" text-anchor="end">{yFormat(t)}</text>
      {/each}
      {#each xTicks ?? x.ticks(Math.max(2, Math.floor(width / 80))) as t}<text class="tick" x={x(t)} y={height - 6} text-anchor="middle">{xFormat(t)}</text>{/each}
      <g clip-path="url(#clip-{uid})">
        {#each layers as l (l.key)}<path d={gen(l as any)} fill={colors[l.key]} stroke="var(--surface)" stroke-width="1" />{/each}
      </g>
      {#if hi !== null}<line class="cross" x1={x(rows[hi].x)} x2={x(rows[hi].x)} y1={m.top} y2={height - m.bottom} />{/if}
    </svg>
  {/if}
  <Tooltip visible={hi !== null} x={hi !== null ? x(rows[hi].x) : 0} y={m.top} containerWidth={width}>
    {#if hi !== null}
      <strong>{xFormat(rows[hi].x)}</strong>
      {#each [...keys].reverse() as k (k)}<div class="row"><span class="sw" style:background={colors[k]}></span>{labels[k]}<span class="v">{yFormat(rows[hi].values[k] ?? 0)}</span></div>{/each}
      <div class="row"><strong>{msg('ui_total')}</strong><span class="v">{yFormat(total(rows[hi]))}</span></div>
    {/if}
  </Tooltip>
</div>

<style>
  .chart { position: relative; width: 100%; }
  svg { display: block; touch-action: pan-y; }
  .grid { stroke: var(--grid); }
  .tick { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
  .cross { stroke: var(--ink-2); }
</style>
