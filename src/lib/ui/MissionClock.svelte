<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { story } from '$lib/scroll/storyState.svelte';
  import { CLOCK_TICKS } from '$lib/story/clock';
  import { CHAPTERS } from '$lib/story/chapters';
  import { ATM_PHASES, phaseClockRanges, phaseOf } from '$lib/story/phases';
  import { dur } from '$lib/scroll/motion';
  import { UI } from './ui-strings';
  import ThemeToggle from './ThemeToggle.svelte';
  import ChapterDrawer from './ChapterDrawer.svelte';

  let { nav = true }: { nav?: boolean } = $props();
  const pos = new Tween(0, { duration: dur(500), easing: cubicOut });
  $effect(() => { pos.target = story.clock; });
  const ranges = phaseClockRanges(CHAPTERS);
  const phaseLabel = $derived(story.phase ? phaseOf(story.phase).label : null);
  const nowText = $derived(phaseLabel ? `${phaseLabel} · ${story.clockLabel}` : story.clockLabel || 'FFS101');
</script>

<div class="clock" style:--phase-color={story.phase ? phaseOf(story.phase).color : 'var(--accent)'}>
  <span class="now" aria-hidden="true"><span class="full">{nowText}</span><span class="short">{phaseLabel ?? (story.clockLabel || 'FFS101')}</span></span>
  <div class="rail" role="progressbar" aria-label={UI.progressLabel} aria-valuemin="0" aria-valuemax="100"
    aria-valuenow={Math.round(story.clock * 100)} aria-valuetext={phaseLabel ? nowText : story.clockLabel || UI.start}>
    {#each ranges as r (r.id)}
      <span class="seg" data-phase={r.id} class:current={story.phase === r.id}
        style:left="{r.start * 100}%" style:width="{(r.end - r.start) * 100}%" style:--c={phaseOf(r.id).color}>
        <span class="sl">{phaseOf(r.id).label}</span>
      </span>
    {/each}
    {#each CLOCK_TICKS as t}<span class="tick" style:left="{t.pos * 100}%"><span class="tl">{t.label}</span></span>{/each}
    <span class="fill" style:width="{pos.current * 100}%"></span>
    <span class="plane" style:left="{pos.current * 100}%" aria-hidden="true">✈</span>
  </div>
  {#if nav}<ChapterDrawer />{/if}
  <ThemeToggle />
</div>

<style>
  .clock { position: fixed; inset: 0 0 auto 0; height: var(--clock-h); z-index: 50; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); font-size: 12px; }
  .now { min-width: 72px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 1; }
  .short { display: none; }
  .rail { position: relative; flex: 1; min-width: 96px; height: 6px; background: var(--grid); border-radius: 3px; }
  .seg { position: absolute; top: 0; height: 6px; background: color-mix(in srgb, var(--c) 35%, transparent); border-left: 1px solid var(--bg); }
  .seg.current { background: color-mix(in srgb, var(--c) 75%, transparent); }
  .sl { position: absolute; bottom: 9px; left: 4px; font-size: 10px; color: var(--ink-2); white-space: nowrap; }
  .seg.current .sl { color: var(--ink); font-weight: 600; }
  .fill { position: absolute; left: 0; top: 2px; height: 2px; background: var(--ink); opacity: 0.6; }
  .tick { position: absolute; top: -1px; width: 1px; height: 8px; background: var(--axis); }
  .tl { position: absolute; top: 9px; transform: translateX(-50%); color: var(--muted); font-size: 10px; white-space: nowrap; }
  .plane { position: absolute; top: -8px; transform: translateX(-50%) rotate(90deg); color: var(--phase-color); font-size: 14px; }
  @media (max-width: 900px) { .tl { display: none; } }
  @media (max-width: 700px) { .sl { display: none; } .now { min-width: 0; max-width: 34%; } .full { display: none; } .short { display: inline; } }
</style>
