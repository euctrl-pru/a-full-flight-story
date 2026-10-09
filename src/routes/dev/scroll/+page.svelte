<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import MissionClock from '$lib/ui/MissionClock.svelte';
  import type { ChapterDef } from '$lib/story/types';
  const chapters: ChapterDef[] = ['one', 'two'].map((id, c) => ({
    id, kicker: `Chapter ${c + 1}`, title: `Test ${id}`, clockLabel: `C${c + 1}`, clock: c * 0.5,
    steps: [0, 1, 2].map((s) => ({ id: `${id}-${s}`, text: `Step ${s} of ${id} [D-eurocontrol] with {IFPS}.`, clock: c * 0.5 + s * 0.1 }))
  }));
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<MissionClock />
{#each chapters as ch (ch.id)}
  <Chapter chapter={ch}>
    {#snippet graphic({ step, progress })}<div class="g" data-testid="graphic-{ch.id}">step {step} · {progress.toFixed(2)}</div>{/snippet}
  </Chapter>
{/each}
<div style="height: 50vh"></div>
