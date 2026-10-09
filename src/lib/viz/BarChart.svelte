<script lang="ts">
  import { scaleBand, scaleLinear, max } from 'd3';
  import type { Bar } from './types';
  import Tooltip from './Tooltip.svelte';
  import { roundedTopBar } from './chart-utils';

  let { bars, label, height = 260, refLine, yFormat = (v: number) => String(Math.round(v)), color = 'var(--series-1)', labelEvery = 1 }: {
    bars: Bar[]; label: string; height?: number; refLine?: { value: number; label: string };
    yFormat?: (v: number) => string; color?: string; labelEvery?: number;
  } = $props();

  let width = $state(0);
  const m = { top: 14, right: 12, bottom: 26, left: 40 };
  const x = $derived(scaleBand().domain(bars.map((b) => b.key)).range([m.left, Math.max(m.left + 1, width - m.right)]).padding(0.22));
  const y = $derived(scaleLinear().domain([0, Math.max(max(bars, (b) => b.value) ?? 1, refLine?.value ?? 0) * 1.1]).nice().range([height - m.bottom, m.top]));
  let hi: number | null = $state(null);
</script>

<div class="chart" bind:clientWidth={width}>
  {#if width > 0}
    <svg {width} {height} role="img" aria-label={label}>
      {#each y.ticks(4) as t}
        <line class="grid" x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} />
        <text class="tick" x={m.left - 6} y={y(t)} dy="0.32em" text-anchor="end">{yFormat(t)}</text>
      {/each}
      {#each bars as b, i (b.key)}
        <path d={roundedTopBar(x(b.key)!, y(b.value), x.bandwidth(), y(0) - y(b.value), 4)} fill={b.color ?? color} opacity={hi === null || hi === i ? 1 : 0.55} stroke={b.emphasis ? 'var(--ink)' : 'none'} stroke-width="1.5" />
        <rect role="presentation" x={x(b.key)! - (x.step() - x.bandwidth()) / 2} y={m.top} width={x.step()} height={height - m.top - m.bottom} fill="transparent" onpointerenter={() => (hi = i)} onpointerleave={() => (hi = null)} />
        {#if i % labelEvery === 0}<text class="tick" x={x(b.key)! + x.bandwidth() / 2} y={height - 6} text-anchor="middle">{x.step() < 72 ? b.label.split(' ')[0] : b.label}</text>{/if}
      {/each}
      <line class="axis" x1={m.left} x2={width - m.right} y1={y(0)} y2={y(0)} />
      {#if refLine}
        <line class="ref" x1={m.left} x2={width - m.right} y1={y(refLine.value)} y2={y(refLine.value)} />
        <text class="reft" x={width - m.right - 2} y={y(refLine.value) - 6} text-anchor="end">{refLine.label}</text>
      {/if}
    </svg>
  {/if}
  <Tooltip visible={hi !== null} x={hi !== null ? x(bars[hi].key)! + x.bandwidth() / 2 : 0} y={m.top} containerWidth={width}>
    {#if hi !== null}<strong>{bars[hi].label}</strong><div class="row">{yFormat(bars[hi].value)}</div>{/if}
  </Tooltip>
</div>

<style>
  .chart { position: relative; width: 100%; }
  svg { display: block; }
  .grid { stroke: var(--grid); }
  .axis { stroke: var(--axis); }
  .tick { fill: var(--muted); font-size: 11px; }
  .ref { stroke: var(--ink); stroke-width: 2; stroke-dasharray: 6 4; }
  .reft { fill: var(--ink); font-size: 12px; font-weight: 600; }
</style>
