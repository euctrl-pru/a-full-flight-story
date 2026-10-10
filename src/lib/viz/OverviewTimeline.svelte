<script lang="ts">
  import { scaleLinear } from 'd3';
  import { EVENTS } from '$lib/story/flight';
  import { CHAPTERS } from '$lib/story/chapters';
  import { ATM_PHASES, phaseOf } from '$lib/story/phases';
  import { timeScale, phaseSpans, TIME_TICKS, scaleHours, CHAPTER_ANCHORS } from '$lib/story/timescale';
  import { stackRows, spreadAlong } from './label-layout';
  import Tooltip from './Tooltip.svelte';
  import SourceLine from './SourceLine.svelte';
  import { reducedMotion } from '$lib/scroll/motion';
  import { replaceState } from '$app/navigation';

  let width = $state(0);
  const vertical = $derived(width > 0 && width < 700);
  const spans = phaseSpans();
  const domain: [number, number] = [spans[0].from, spans.at(-1)!.to];
  const len = $derived(vertical ? 760 : Math.max(1, width - 32));
  const s = $derived(scaleLinear().domain(domain).range([16, 16 + len]));
  const chapters = CHAPTERS.filter((c) => c.id in CHAPTER_ANCHORS).map((c) => ({ c, at: timeScale(EVENTS.find((e) => e.id === CHAPTER_ANCHORS[c.id])!.at) }));
  const labelPos = $derived(vertical ? spreadAlong(chapters.map((d) => s(d.at)), 24) : chapters.map((d) => s(d.at)));
  const rows = $derived(vertical ? chapters.map(() => 0) : stackRows(chapters.map((d) => ({ x: s(d.at) - 4, w: d.c.title.length * 7 + 8 })), 8));
  const nRows = $derived(Math.max(...rows) + 1);
  let hi: (typeof EVENTS)[number] | null = $state(null);
  function go(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    replaceState(`#${id}`, {});
  }
  const H = $derived(vertical ? len + 40 : 70 + nRows * 22);
</script>

<div class="ot" bind:clientWidth={width}>
  {#if width}
    <svg width={width} height={H} role="img" aria-label="Timeline of FFS101 from ten months before take-off to a year after, coloured by planning phase">
      {#each spans as p (p.id)}
        {#if vertical}
          <rect x="104" y={s(p.from)} width="10" height={s(p.to) - s(p.from)} fill={phaseOf(p.id).color} opacity="0.8" />
          <text class="pl" x="98" y={(s(p.from) + s(p.to)) / 2} text-anchor="end">{phaseOf(p.id).label}</text>
        {:else}
          <rect x={s(p.from)} y="20" width={s(p.to) - s(p.from)} height="10" fill={phaseOf(p.id).color} opacity="0.8" />
          <text class="pl" x={(s(p.from) + s(p.to)) / 2} y="14" text-anchor="middle">{phaseOf(p.id).label}</text>
        {/if}
      {/each}
      {#each TIME_TICKS as t (t.label)}
        {#if vertical}<text class="tk" x="120" y={s(scaleHours(t.h)) + 4}>{t.label}</text>
        {:else}<text class="tk" x={s(scaleHours(t.h))} y="44" text-anchor="middle">{t.label}</text>{/if}
      {/each}
      {#each EVENTS as e (e.id)}
        {@const v = s(timeScale(e.at))}
        <circle role="presentation" cx={vertical ? 109 : v} cy={vertical ? v : 25} r="3.5" class="ev"
          onpointerenter={() => (hi = e)} onpointerleave={() => (hi = null)} />
      {/each}
      {#each chapters as d, i (d.c.id)}
        {@const x = labelPos[i]}
        {#if vertical}
          <line class="lead" x1="114" x2="170" y1={s(d.at)} y2={x} />
        {:else}
          <line class="lead" x1={s(d.at)} x2={s(d.at)} y1="30" y2={58 + rows[i] * 22} />
        {/if}
      {/each}
    </svg>
    <ol class="labels" aria-label="Chapters on the timeline">
      {#each chapters as d, i (d.c.id)}
        <li style:left={vertical ? '176px' : `${labelPos[i] - 4}px`} style:top={vertical ? `${labelPos[i] - 10}px` : `${52 + rows[i] * 22}px`}>
          <button type="button" onclick={() => go(d.c.id)} style:--c={d.c.phase ? phaseOf(d.c.phase).color : 'var(--accent)'}>{d.c.title}</button>
        </li>
      {/each}
    </ol>
    <Tooltip visible={!!hi} x={hi ? (vertical ? 114 : s(timeScale(hi.at))) : 0} y={hi ? (vertical ? s(timeScale(hi.at)) : 30) : 0} containerWidth={width}>
      {#if hi}<strong>{hi.label}</strong><div class="row">{new Date(hi.at).toUTCString().slice(5, 22)} UTC</div>{/if}
    </Tooltip>
  {/if}
  <SourceLine ids={['S8', 'S7']} illustrative detail="signed-log time axis relative to FFS101’s off-block time" />
</div>

<style>
  .ot { position: relative; width: 100%; }
  svg { display: block; overflow: visible; }
  .pl { fill: var(--ink); font-size: 12px; font-weight: 600; }
  .tk { fill: var(--muted); font-size: 11px; }
  .ev { fill: var(--ink); stroke: var(--bg); stroke-width: 1.5; }
  .lead { stroke: var(--axis); stroke-width: 1; }
  .labels { list-style: none; margin: 0; padding: 0; position: absolute; inset: 0; pointer-events: none; }
  .labels li { position: absolute; pointer-events: auto; }
  .labels button { all: unset; cursor: pointer; font-size: 13px; padding: 1px 6px; border-radius: 6px; border-left: 3px solid var(--c); background: var(--surface); white-space: nowrap; }
  .labels button:hover, .labels button:focus-visible { background: var(--surface-2); outline: 2px solid var(--accent); }
</style>
