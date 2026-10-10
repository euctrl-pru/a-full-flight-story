<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import { ACTORS, PHASES, matrix } from '$lib/story/stakeholders';
  import { EVENTS, type Phase } from '$lib/story/flight';
  import Tooltip from './Tooltip.svelte';
  let { upTo }: { upTo: Phase } = $props();
  const cells = matrix(EVENTS);
  const limit = $derived(PHASES.findIndex((p) => p.id === upTo));
  let width = $state(0);
  // narrow screens: actor names sit above their row so all nine phase columns fit
  const narrow = $derived(width < 560);
  const rowH = $derived(narrow ? 34 : 26);
  const left = $derived(narrow ? 0 : 190);
  const top = 28;
  const colW = $derived(Math.max(24, (width - left - 8) / PHASES.length));
  const dotY = (i: number) => top + i * rowH + (narrow ? 22 : 12);
  let hi: (typeof cells)[number] | null = $state(null);
</script>

<div class="sm" bind:clientWidth={width}>
  {#if width}
    <svg {width} height={top + ACTORS.length * rowH + 8} role="img" aria-label={msg('fig_matrix_aria')}>
      {#each PHASES as p, j (p.id)}<text class="ph" x={left + j * colW + colW / 2} y="14" text-anchor="middle" opacity={j <= limit ? 1 : 0.35}>{width > 700 ? p.label : p.label.slice(0, 3)}</text>{/each}
      {#each ACTORS as a, i (a.id)}
        <text class="ac" x="0" y={narrow ? top + i * rowH + 10 : top + i * rowH + 16}>{a.label}</text>
        <line class="g" x1={left} x2={width - 8} y1={dotY(i)} y2={dotY(i)} />
      {/each}
      {#each cells as c (c.actor + c.phase)}
        {@const i = ACTORS.findIndex((a) => a.id === c.actor)}
        {@const j = PHASES.findIndex((p) => p.id === c.phase)}
        <circle role="presentation" cx={left + j * colW + colW / 2} cy={dotY(i)} r={4 + Math.min(4, c.events.length * 1.5)} class="dot" opacity={j <= limit ? 1 : 0.12} onpointerenter={() => (hi = c)} onpointerleave={() => (hi = null)} />
      {/each}
    </svg>
  {/if}
  <Tooltip visible={!!hi} x={hi ? left + PHASES.findIndex((p) => p.id === hi!.phase) * colW + colW / 2 : 0} y={hi ? dotY(ACTORS.findIndex((a) => a.id === hi!.actor)) : 0} containerWidth={width}>
    {#if hi}{#each hi.events as e (e.id)}<div>{e.label}</div>{/each}{/if}
  </Tooltip>
</div>

<style>
  .sm { position: relative; width: 100%; }
  svg { display: block; }
  .ph { fill: var(--ink-2); font-size: 11px; } .ac { fill: var(--ink); font-size: 12px; }
  .g { stroke: var(--grid); } .dot { fill: var(--accent); stroke: var(--surface); stroke-width: 2; transition: opacity 300ms; }
</style>
