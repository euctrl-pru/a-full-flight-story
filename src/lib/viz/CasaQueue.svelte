<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import { scaleLinear } from 'd3';
  import { scenario, REGULATION, HERO_CASA } from '$lib/story/scenario';
  import { hourlyCounts } from '$lib/sim/demand';
  import { fmtHm, fmtInt } from './chart-utils';
  import BarChart from './BarChart.svelte';
  import Tooltip from './Tooltip.svelte';
  import { Tween } from 'svelte/motion';
  import { cubicInOut } from 'svelte/easing';
  import { dur } from '$lib/scroll/motion';

  let { stage }: { stage: 'demand' | 'regulation' | 'queue' | 'hero' | 'explore' } = $props();
  let rate = $state(REGULATION.rate);
  $effect(() => { if (stage !== 'explore') rate = REGULATION.rate; });
  const sc = $derived(scenario(rate));
  const bars = $derived(hourlyCounts(sc.flights, 240, 600).map((b) => ({ key: String(b.start), label: fmtHm(b.start), value: b.count, color: b.start >= REGULATION.start && b.start < REGULATION.end && b.count > rate ? 'var(--status-critical)' : 'var(--series-1)' })));
  const regulated = $derived(sc.allocations.filter((a) => a.regulated));
  const totalDelay = $derived(regulated.reduce((s, a) => s + a.delay, 0));
  let width = $state(0);
  const h = 170, m = { l: 12, r: 28 };
  const x = $derived(scaleLinear().domain([REGULATION.start - 10, REGULATION.end + 60]).range([m.l, Math.max(m.l + 1, width - m.r)]));
  let hi: (typeof regulated)[number] | null = $state(null);
  const slide = new Tween(0, { duration: dur(900), easing: cubicInOut });
  $effect(() => { slide.target = stage === 'queue' || stage === 'hero' || stage === 'explore' ? 1 : 0; });
  const given = (a: { eto: number; entry: number }) => x(a.eto + (a.entry - a.eto) * slide.current);
</script>

<div class="casa">
  <BarChart {bars} label={msg('fig_casa_bars')} refLine={stage === 'demand' ? undefined : { value: rate, label: msg('fig_casa_capacity_ref', { rate }) }} height={200} />
  {#if stage !== 'demand' && stage !== 'regulation'}
    <div class="belt" bind:clientWidth={width}>
      {#if width}
        <svg {width} height={h} role="img" aria-label={msg('fig_casa_belt_aria')}>
          <text class="rl" x={m.l} y="18">{msg('fig_casa_wanted')}</text>
          <text class="rl" x={m.l} y={h - 52}>{msg('fig_casa_given')}</text>
          {#each regulated as a (a.id)}
            {@const hero = a.id === HERO_CASA.id}
            <line x1={x(a.eto)} y1="30" x2={given(a)} y2={h - 64} class="link" class:hero opacity={stage === 'hero' && !hero ? 0.25 : 0.7} />
            <circle cx={x(a.eto)} cy="30" r={hero ? 6 : 3} class="dot" class:hero />
            <circle cx={given(a)} cy={h - 64} r={hero ? 6 : 3} class="dot" class:hero role="presentation" onpointerenter={() => (hi = a)} onpointerleave={() => (hi = null)} />
          {/each}
          {#each [300, 360, 420, 480, 540, 600] as t}<text class="tick" x={x(t)} y={h - 30} text-anchor="middle">{fmtHm(t)}</text>{/each}
        </svg>
      {/if}
      <Tooltip visible={!!hi} x={hi ? given(hi) : 0} y={h - 64} containerWidth={width}>
        {#if hi}<strong>{hi.id}</strong><div class="row">{msg('fig_casa_tip_wanted', { time: fmtHm(hi.eto) })}<span class="v">+{hi.delay} min</span></div>{/if}
      </Tooltip>
    </div>
    <p class="stat">
      <strong>FFS101:</strong> {msg('fig_casa_hero_stat', { delay: sc.hero.delay, ctot: fmtHm(sc.hero.ctot) })} ·
      <strong>{msg('fig_casa_total_label')}</strong> {msg('fig_casa_total_stat', { minutes: fmtInt(totalDelay), flights: regulated.length })}
    </p>
  {/if}
  {#if stage === 'explore'}
    <label class="slider">{msg('fig_casa_slider')} <strong>{msg('fig_casa_slider_value', { rate })}</strong>
      <input type="range" min="20" max="56" step="1" bind:value={rate} />
    </label>
  {/if}
</div>

<style>
  .casa { display: flex; flex-direction: column; gap: 8px; height: 100%; justify-content: center; padding: 16px; }
  .belt { position: relative; }
  svg { display: block; }
  .rl, .tick { fill: var(--muted); font-size: 11px; }
  .link { stroke: var(--muted); stroke-width: 1; }
  .link.hero { stroke: var(--status-critical); stroke-width: 2; }
  .dot { fill: var(--series-1); stroke: var(--surface); stroke-width: 1; }
  .dot.hero { fill: var(--status-critical); stroke: var(--ink); stroke-width: 1.5; }
  .stat { font-size: 14px; margin: 0; }
  .slider { display: flex; flex-direction: column; gap: 4px; font-size: 14px; }
  input[type='range'] { width: 100%; accent-color: var(--accent); }
</style>
