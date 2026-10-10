<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import { scaleLinear } from 'd3';
  import { ACDM, TURNAROUND } from '$lib/story/flight';
  import { SLOT_TOLERANCE } from '$lib/sim/casa';
  import { fmtHm } from './chart-utils';

  let { stage }: { stage: 'milestones' | 'turnaround' | 'window' } = $props();
  const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
  let width = $state(0);
  // narrow screens: task labels sit above their bars instead of in a left column
  const narrow = $derived(width < 640);
  const labelW = $derived(narrow ? 0 : 270);
  const rowH = $derived(narrow ? 34 : 26);
  const top = 30;
  const x = $derived(scaleLinear().domain([hm('04:00'), hm('05:50')]).range([labelW + 4, Math.max(labelW + 5, width - 12)]));

  // milestones sharing a minute are merged into one label; labels are then stacked into rows so they never overlap
  const MS = [
    { k: 'EOBT', t: ACDM.eobt }, { k: 'TOBT', t: ACDM.tobt }, { k: 'TSAT', t: ACDM.tsat },
    { k: 'AOBT', t: ACDM.aobt }, { k: 'CTOT', t: ACDM.ctotFinal }, { k: 'ATOT', t: ACDM.atot }
  ];
  const merged = Object.values(
    MS.reduce<Record<string, { keys: string[]; t: string }>>((acc, m) => {
      (acc[m.t] ??= { keys: [], t: m.t }).keys.push(m.k);
      return acc;
    }, {})
  ).sort((a, b) => hm(a.t) - hm(b.t));
  const placed = $derived.by(() => {
    const rowsEnd: number[] = [];
    return merged.map((m) => {
      const px = x(hm(m.t));
      const label = `${m.keys.join(' · ')} ${m.t}`;
      const w = label.length * 6.6;
      const anchorEnd = px + w / 2 > width - 4;
      const left = anchorEnd ? px - w : px - w / 2;
      let row = rowsEnd.findIndex((end) => end < left - 6);
      if (row === -1) { row = rowsEnd.length; rowsEnd.push(0); }
      rowsEnd[row] = left + w;
      return { px, label, row, anchorEnd };
    });
  });
  const labelRows = $derived(Math.max(1, ...placed.map((p) => p.row + 1)));
  const barsBottom = $derived(top + TURNAROUND.length * rowH);
  const h = $derived(barsBottom + 18 + (labelRows + (stage === 'window' ? 1 : 0)) * 15 + 8);
</script>

<div class="acdm" bind:clientWidth={width}>
  {#if width}
    <svg {width} height={h} role="img" aria-label={msg('fig_acdm_aria')}>
      {#each [hm('04:00'), hm('04:30'), hm('05:00'), hm('05:30')] as t}
        <text class="tick" x={x(t)} y="12" text-anchor={t === hm('04:00') ? 'start' : 'middle'}>{fmtHm(t)}{narrow ? '' : ` ${msg('ui_utc')}`}</text>
      {/each}
      {#if stage === 'window'}
        {@const c = hm(ACDM.ctotFinal)}
        {@const old = x(hm(ACDM.ctotPlanned))}
        <rect class="win" x={x(c - SLOT_TOLERANCE.before)} y={top - 8} width={x(c + SLOT_TOLERANCE.after) - x(c - SLOT_TOLERANCE.before)} height={barsBottom - top + 8} />
        <text class="wt" x={x(c - SLOT_TOLERANCE.before) + 4} y={barsBottom - 6}>−5/+10</text>
        <line class="old" x1={old} x2={old} y1={top - 8} y2={barsBottom + 6 + labelRows * 15} />
        <text class="oldt" x={old} y={barsBottom + 18 + labelRows * 15} text-anchor="end">{msg('fig_acdm_old_ctot', { time: ACDM.ctotPlanned })}</text>
      {/if}
      {#each TURNAROUND as t, i (t.id)}
        {@const y0 = top + i * rowH}
        {#if narrow}
          {@const late = x(hm(t.start)) > width * 0.45}
          <text class="task" x={late ? x(hm(t.end)) : x(hm(t.start))} y={y0 + 10} text-anchor={late ? 'end' : 'start'}>{t.label}</text>
          <rect class="bar" class:dim={stage === 'milestones'} x={x(hm(t.start))} y={y0 + 14} width={Math.max(2, x(hm(t.end)) - x(hm(t.start)))} height={rowH - 20} rx="3" />
        {:else}
          <text class="task" x="0" y={y0 + 15}>{t.label}</text>
          <rect class="bar" class:dim={stage === 'milestones'} x={x(hm(t.start))} y={y0 + 4} width={Math.max(2, x(hm(t.end)) - x(hm(t.start)))} height={rowH - 10} rx="4" />
        {/if}
      {/each}
      {#each placed as p (p.label)}
        <line class="ms" x1={p.px} x2={p.px} y1={top - 8} y2={barsBottom + 6 + p.row * 15} />
        <text class="msk" x={p.px} y={barsBottom + 18 + p.row * 15} text-anchor={p.anchorEnd ? 'end' : 'middle'}>{p.label}</text>
      {/each}
    </svg>
  {/if}
</div>

<style>
  .acdm { width: 100%; }
  svg { display: block; }
  .task { fill: var(--ink-2); font-size: 12px; }
  .bar { fill: var(--series-1); transition: opacity 300ms; }
  .bar.dim { opacity: 0.25; }
  .ms { stroke: var(--ink); stroke-width: 1; stroke-dasharray: 2 3; }
  .msk { fill: var(--ink); font-size: 11px; font-weight: 600; }
  .tick { fill: var(--muted); font-size: 11px; }
  .win { fill: color-mix(in srgb, var(--status-good) 18%, transparent); stroke: var(--status-good); }
  .wt { fill: var(--status-good); font-size: 11px; font-weight: 600; }
  .old { stroke: var(--status-critical); stroke-width: 2; stroke-dasharray: 4 3; }
  .oldt { fill: var(--status-critical); font-size: 12px; }
</style>
