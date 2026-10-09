<script lang="ts">
  import type { StepDef } from '$lib/story/types';
  import RichText from './RichText.svelte';
  let { step }: { step: StepDef } = $props();
</script>

<div class="card">
  {#if step.illustrative}<span class="badge" title="FFS101 is a fictional flight; the process is real">Illustrative</span>{/if}
  <RichText text={step.text} />
</div>

<style>
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px 20px; box-shadow: 0 10px 40px rgb(0 0 0 / 0.25); }
  .card :global(p) { margin: 0 0 0.7em; }
  .card :global(p:last-child) { margin-bottom: 0; }
  .badge { display: inline-block; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ink-2); border: 1px solid var(--border); border-radius: 999px; padding: 2px 8px; margin-bottom: 8px; }
</style>
