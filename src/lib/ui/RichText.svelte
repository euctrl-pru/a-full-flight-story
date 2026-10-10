<script lang="ts">
  import { parseRich } from '$lib/story/richtext';
  import { dayPhrase, livePhrase } from '$lib/story/freshness';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import type { EntityKey } from '$lib/data/eurocontrol';
  import Cite from './Cite.svelte';
  import Term from './Term.svelte';
  let { text }: { text: string } = $props();
  const paragraphs = $derived(text.split(/\n\s*\n/).map((p) => parseRich(p.trim())));
  const resolve = (name: string, arg: string) =>
    name === 'date' ? dayPhrase(bundle(arg as EntityKey)?.dataDate) : name === 'live' ? livePhrase(ec.reportFreshness) : '';
</script>

{#each paragraphs as runs}
  <p>
    {#each runs as r}
      {#if r.kind === 'text'}{r.text}{:else if r.kind === 'strong'}<strong>{r.text}</strong>{:else if r.kind === 'em'}<em>{r.text}</em>{:else if r.kind === 'term'}<Term id={r.id} text={r.text} />{:else if r.kind === 'var'}<span class="var">{resolve(r.name, r.arg)}</span>{:else if r.kind === 'cite'}<Cite ids={r.ids} />{/if}
    {/each}
  </p>
{/each}
