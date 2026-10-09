<script lang="ts">
  import { scaleLinear } from 'd3';
  import { scenario, REGULATION, HERO_CASA } from '$lib/story/scenario';
  import { hourlyCounts } from '$lib/sim/demand';
  import { fmtHm, fmtInt } from './chart-utils';
  import BarChart from './BarChart.svelte';
  import Tooltip from './Tooltip.svelte';

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
</script>

<div class="casa">
  <BarChart {bars} label="Flights wanting to enter the sector, per hour" refLine={stage === 'demand' ? undefined : { value: rate, label: `Capacity ${rate}/h` }} height={200} />
  {#if stage !== 'demand' && stage !== 'regulation'}
    <div class="belt" bind:clientWidth={width}>
      {#if width}
        <svg {width} height={h} role="img" aria-label="Each flight's wanted versus allocated entry time">
          <text class="rl" x={m.l} y="18">Wanted (ETO)</text>
          <text class="rl" x={m.l} y={h - 52}>Given slot</text>
          {#each regulated as a (a.id)}
            {@const hero = a.id === HERO_CASA.id}
            <line x1={x(a.eto)} y1="30" x2={x(a.entry)} y2={h - 64} class="link" class:hero opacity={stage === 'hero' && !hero ? 0.25 : 0.7} />
            <circle cx={x(a.eto)} cy="30" r={hero ? 6 : 3} class="dot" class:hero />
            <circle cx={x(a.entry)} cy={h - 64} r={hero ? 6 : 3} class="dot" class:hero role="presentation" onpointerenter={() => (hi = a)} onpointerleave={() => (hi = null)} />
          {/each}
          {#each [300, 360, 420, 480, 540, 600] as t}<text class="tick" x={x(t)} y={h - 30} text-anchor="middle">{fmtHm(t)}</text>{/each}
        </svg>
      {/if}
      <Tooltip visible={!!hi} x={hi ? x(hi.entry) : 0} y={h - 64} containerWidth={width}>
        {#if hi}<strong>{hi.id}</strong><div class="row">wanted {fmtHm(hi.eto)}<span class="v">+{hi.delay} min</span></div>{/if}
      </Tooltip>
    </div>
    <p class="stat">
      <strong>FFS101:</strong> +{sc.hero.delay} min → CTOT {fmtHm(sc.hero.ctot)} ·
      <strong>All regulated flights:</strong> {fmtInt(totalDelay)} delay minutes across {regulated.length} flights
    </p>
  {/if}
  {#if stage === 'explore'}
    <label class="slider">Sector capacity: <strong>{rate} flights/hour</strong>
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
