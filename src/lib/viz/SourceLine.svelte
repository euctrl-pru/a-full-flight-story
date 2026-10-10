<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import { getSource } from '$lib/story/sources';
  import Cite from '$lib/ui/Cite.svelte';
  import FreshnessBadge from '$lib/ui/FreshnessBadge.svelte';
  import type { Freshness } from '$lib/data/live';
  import { fmtDate } from './chart-utils';
  let { ids, detail, freshness = null, dataDate = null, illustrative = false }: {
    ids: string[]; detail?: string; freshness?: Freshness | null; dataDate?: string | null; illustrative?: boolean;
  } = $props();
</script>

<p class="source">
  <span class="lbl">{msg('ui_source')}</span>
  {#each ids as id, i (id)}{getSource(id).publisher} — {getSource(id).title}<Cite ids={[id]} />{i < ids.length - 1 ? '; ' : ''}{/each}
  {#if detail}<span> · {detail}</span>{/if}
  {#if dataDate}<span> · {msg('ui_data_to', { date: fmtDate(dataDate) })}</span>{/if}
  {#if freshness}<span> </span><FreshnessBadge {freshness} />{/if}
  {#if illustrative}<span class="ill"> · {msg('ui_illustrative_note')}</span>{/if}
</p>

<style>
  .source { font-size: 12px; line-height: 1.5; color: var(--muted); margin: 8px 0 0; }
  .lbl { font-weight: 600; color: var(--ink-2); }
  .ill { font-style: italic; }
</style>
