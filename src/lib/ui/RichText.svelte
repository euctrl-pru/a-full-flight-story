<script lang="ts">
  import { parseRich } from '$lib/story/richtext';
  import Cite from './Cite.svelte';
  import Term from './Term.svelte';
  let { text }: { text: string } = $props();
  const paragraphs = $derived(text.split(/\n\s*\n/).map((p) => parseRich(p.trim())));
</script>

{#each paragraphs as runs}
  <p>
    {#each runs as r}
      {#if r.kind === 'text'}{r.text}{:else if r.kind === 'strong'}<strong>{r.text}</strong>{:else if r.kind === 'em'}<em>{r.text}</em>{:else if r.kind === 'term'}<Term id={r.id} text={r.text} />{:else if r.kind === 'cite'}<Cite ids={r.ids} />{/if}
    {/each}
  </p>
{/each}
