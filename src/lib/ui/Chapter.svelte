<script lang="ts">
  import { replaceState } from '$app/navigation';
  import type { Snippet } from 'svelte';
  import type { ChapterDef } from '$lib/story/types';
  import Scrolly from '$lib/scroll/Scrolly.svelte';
  import StepCard from './StepCard.svelte';
  import { story } from '$lib/scroll/storyState.svelte';
  import { phaseOf } from '$lib/story/phases';
  import { reveal } from '$lib/scroll/reveal';
  import { near } from '$lib/scroll/near';

  let { chapter, graphic }: { chapter: ChapterDef; graphic: Snippet<[{ step: number; progress: number }]> } = $props();
  let step = $state(0);
  // mount the (heavy) graphic only once the chapter comes within one viewport
  let awake = $state(false);
  let progress = $state(0);

  function onstep(i: number) {
    step = i;
    progress = 0;
    story.chapterId = chapter.id;
    story.chapterTitle = chapter.title;
    story.clock = chapter.steps[i]?.clock ?? chapter.clock;
    story.clockLabel = chapter.clockLabel;
    story.phase = chapter.phase;
    if (typeof location !== 'undefined' && location.hash !== `#${chapter.id}`) {
      try { replaceState(`#${chapter.id}`, {}); } catch { /* router not ready yet (very first paint) */ }
    }
  }
</script>

<section class="chapter" id={chapter.id} aria-labelledby="{chapter.id}-title" data-active-step={step} style:--phase-color={chapter.phase ? phaseOf(chapter.phase).color : 'var(--accent)'}>
  <header class="head" use:reveal>
    <p class="kicker">
      {#if chapter.phase}<span class="phase-pill">{phaseOf(chapter.phase).label}</span>{/if}
      {chapter.kicker}
    </p>
    <h2 id="{chapter.id}-title">{chapter.title}</h2>
  </header>
  <div class="scrolly">
    <div class="graphic" use:near={() => (awake = true)}>{#if awake}{@render graphic({ step, progress })}{/if}</div>
    <div class="steps-wrap">
      <Scrolly {onstep} onprogress={(i, p) => { if (i === step) progress = p; }}>
        {#each chapter.steps as s, i (s.id)}
          <div class="step" data-step={i} class:active={i === step}><StepCard step={s} /></div>
        {/each}
      </Scrolly>
    </div>
  </div>
</section>

<style>
  .head { max-width: 760px; margin: 0 auto; padding: 28vh 16px 8vh; opacity: 0; transform: translateY(20px); transition: opacity 700ms ease, transform 700ms ease; }
  .head:global(.revealed) { opacity: 1; transform: none; }
  .kicker { text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px; color: var(--ink-2); margin: 0 0 8px; }
  h2 { font-size: clamp(32px, 5vw, 56px); margin: 0; }
  .scrolly { position: relative; }
  .graphic { position: sticky; top: var(--clock-h); height: calc(100svh - var(--clock-h)); padding-left: var(--step-col); overflow: hidden; }
  .steps-wrap { position: relative; z-index: 2; margin-top: calc(-100svh + var(--clock-h)); pointer-events: none; }
  .step { min-height: 95svh; display: flex; align-items: center; padding: 0 24px; }
  .step:last-child { min-height: 110svh; }
  .step :global(.card) { pointer-events: auto; width: min(100%, 380px); transition: border-color 300ms; }
  .step.active :global(.card) { border-color: var(--phase-color); }
  .phase-pill { display: inline-block; margin-right: 10px; padding: 2px 10px; border-radius: 999px; border: 1px solid var(--phase-color); color: var(--ink); background: color-mix(in srgb, var(--phase-color) 22%, transparent); letter-spacing: 0.06em; }
  @media (max-width: 1023px) {
    .step { align-items: flex-end; padding: 0 16px 6svh; }
    .step :global(.card) { width: 100%; background: color-mix(in srgb, var(--surface) 94%, transparent); backdrop-filter: blur(6px); }
  }
</style>
