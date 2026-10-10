<script lang="ts">
  import { onMount } from 'svelte';
  import type { AtmPhase } from '$lib/story/types';
  import { ATM_PHASES, phaseOf, atmPhaseOfEvent } from '$lib/story/phases';
  import { phaseSpans } from '$lib/story/timescale';
  import { CHAPTERS } from '$lib/story/chapters';
  import { EVENTS } from '$lib/story/flight';
  import { ACTORS } from '$lib/story/stakeholders';
  import { story } from '$lib/scroll/storyState.svelte';
  import { reveal } from '$lib/scroll/reveal';
  import { UI } from './ui-strings';
  import Cite from './Cite.svelte';

  let { phase }: { phase: AtmPhase } = $props();
  const p = $derived(phaseOf(phase));
  const actors = $derived(ACTORS.filter((a) => EVENTS.some((e) => e.actor === a.id && atmPhaseOfEvent(e.phase) === phase)));
  const spans = phaseSpans();
  const lo = spans[0].from, hi = spans.at(-1)!.to;
  const firstChapter = $derived(CHAPTERS.find((c) => c.phase === phase)!);
  let el: HTMLElement;
  onMount(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        story.phase = phase;
        story.clock = firstChapter.clock;
        story.clockLabel = firstChapter.clockLabel;
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  });
</script>

<section class="phase-divider" id="phase-{phase}" bind:this={el} use:reveal style:--c={p.color} aria-labelledby="phase-{phase}-title">
  <p class="eyebrow">Phase {ATM_PHASES.findIndex((x) => x.id === phase) + 1} of 4</p>
  <h2 id="phase-{phase}-title">{p.label}</h2>
  <p class="horizon">{p.horizon}</p>
  <svg class="strip" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
    {#each spans as s (s.id)}
      <rect x={((s.from - lo) / (hi - lo)) * 100} y="0" width={((s.to - s.from) / (hi - lo)) * 100} height="6" fill={phaseOf(s.id).color} opacity={s.id === phase ? 1 : 0.25} />
    {/each}
  </svg>
  <div class="cols">
    <div>
      <h3>{UI.whatDecided}</h3>
      <p>{p.decides}<Cite ids={p.sources} /></p>
    </div>
    <div>
      <h3>{UI.whoAtTable}</h3>
      <ul class="chips">{#each actors as a, i (a.id)}<li class="chip" style:--i={i}>{a.label}</li>{/each}</ul>
    </div>
  </div>
</section>

<style>
  .phase-divider { min-height: 90svh; max-width: 980px; margin: 0 auto; padding: 18vh 16px 10vh; display: flex; flex-direction: column; justify-content: center; }
  .eyebrow { text-transform: uppercase; letter-spacing: 0.14em; font-size: 13px; color: var(--ink-2); margin: 0; }
  h2 { font-size: clamp(48px, 9vw, 104px); margin: 0.1em 0; color: var(--ink); text-decoration: underline; text-decoration-color: var(--c); text-decoration-thickness: 6px; text-underline-offset: 10px; }
  .horizon { font-size: 22px; color: var(--ink-2); margin: 0 0 18px; }
  .strip { width: 100%; height: 10px; margin-bottom: 28px; }
  .cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
  h3 { font-family: var(--font-sans); font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-2); margin: 0 0 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
  .chip { padding: 4px 10px; border-radius: 999px; border: 1px solid var(--c); font-size: 14px; }
  /* entrance */
  .phase-divider > * { opacity: 0; transform: translateY(16px); transition: opacity 600ms ease, transform 600ms ease; }
  .phase-divider:global(.revealed) > * { opacity: 1; transform: none; }
  .phase-divider:global(.revealed) .chip { animation: pop 400ms both; animation-delay: calc(var(--i) * 60ms); }
  @keyframes pop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: none; } }
</style>
