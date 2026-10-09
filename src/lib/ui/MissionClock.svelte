<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { story } from '$lib/scroll/storyState.svelte';
  import { CLOCK_TICKS } from '$lib/story/clock';
  import { dur } from '$lib/scroll/motion';
  import ThemeToggle from './ThemeToggle.svelte';

  const pos = new Tween(0, { duration: dur(500), easing: cubicOut });
  $effect(() => { pos.target = story.clock; });
</script>

<div class="clock">
  <span class="now" aria-hidden="true">{story.clockLabel || 'FFS101'}</span>
  <div class="rail" role="progressbar" aria-label="Where we are in the flight's life" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(story.clock * 100)} aria-valuetext={story.clockLabel || 'Start'}>
    {#each CLOCK_TICKS as t}<span class="tick" style:left="{t.pos * 100}%"><span class="tl">{t.label}</span></span>{/each}
    <span class="fill" style:width="{pos.current * 100}%"></span>
    <span class="plane" style:left="{pos.current * 100}%" aria-hidden="true">✈</span>
  </div>
  <ThemeToggle />
</div>

<style>
  .clock { position: fixed; inset: 0 0 auto 0; height: var(--clock-h); z-index: 50; display: flex; align-items: center; gap: 16px; padding: 0 16px; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); font-size: 12px; }
  .now { min-width: 72px; font-weight: 600; white-space: nowrap; }
  .rail { position: relative; flex: 1; height: 2px; background: var(--grid); }
  .fill { position: absolute; left: 0; top: 0; height: 2px; background: var(--accent); }
  .tick { position: absolute; top: -3px; width: 1px; height: 8px; background: var(--axis); }
  .tl { position: absolute; top: 9px; transform: translateX(-50%); color: var(--muted); font-size: 10px; white-space: nowrap; }
  .plane { position: absolute; top: -9px; transform: translateX(-50%) rotate(90deg); color: var(--ink); font-size: 14px; }
  @media (max-width: 700px) { .tl { display: none; } .now { min-width: 0; } }
</style>
