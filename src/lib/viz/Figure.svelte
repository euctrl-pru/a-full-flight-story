<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Freshness } from '$lib/data/live';
  import type { TableSpec } from './types';
  import DataTable from './DataTable.svelte';
  import SourceLine from './SourceLine.svelte';
  let { title, subtitle, sources, detail, freshness = null, dataDate = null, illustrative = false, table, children }: {
    title: string; subtitle?: string; sources: string[]; detail?: string; freshness?: Freshness | null;
    dataDate?: string | null; illustrative?: boolean; table?: TableSpec; children: Snippet;
  } = $props();
</script>

<figure class="figure">
  <figcaption><h3>{title}</h3>{#if subtitle}<p>{subtitle}</p>{/if}</figcaption>
  <div class="plot">{@render children()}</div>
  {#if table}<DataTable spec={table} />{/if}
  <SourceLine ids={sources} {detail} {freshness} {dataDate} {illustrative} />
</figure>

<style>
  .figure { min-width: 0; margin: 0; padding: 16px; height: 100%; display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
  h3 { font-family: var(--font-sans); font-size: 16px; font-weight: 650; margin: 0; }
  figcaption p { margin: 2px 0 8px; font-size: 13px; color: var(--ink-2); }
  .plot { position: relative; flex: 1; min-height: 0; }
</style>
