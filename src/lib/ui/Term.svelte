<script lang="ts">
  import { GLOSSARY } from '$lib/story/glossary';
  import Cite from './Cite.svelte';
  let { id, text }: { id: string; text: string } = $props();
  const g = $derived(GLOSSARY[id]);
  let hover = $state(false);
  let pinned = $state(false);
  const open = $derived(hover || pinned);
</script>

<span class="term" onmouseenter={() => (hover = true)} onmouseleave={() => (hover = false)} role="presentation">
  <button type="button" aria-expanded={open} onclick={() => (pinned = !pinned)} onblur={() => (pinned = false)}>{text}</button>
  {#if open && g}
    <span class="pop" role="tooltip">
      <strong>{g.term}</strong> — {g.expansion}<br />{g.definition}<Cite ids={g.sources} />
    </span>
  {/if}
</span>

<style>
  .term { position: relative; }
  button { all: unset; cursor: help; border-bottom: 1px dotted var(--ink-2); }
  button:focus-visible { outline: 2px solid var(--accent); }
  .pop { position: absolute; left: 0; top: calc(100% + 6px); z-index: 30; width: min(300px, 80vw); padding: 10px 12px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px; font-size: 14px; line-height: 1.45; color: var(--ink); }
</style>
