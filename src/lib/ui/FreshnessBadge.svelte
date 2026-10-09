<script lang="ts">
  import type { Freshness } from '$lib/data/live';
  let { freshness }: { freshness: Freshness | null } = $props();
</script>

{#if freshness}
  <span class="fresh {freshness}" title={freshness === 'live' ? 'Fetched live from the EUROCONTROL API in your browser' : 'Bundled snapshot (live fetch unavailable or not newer)'}>
    {freshness === 'live' ? '● Live' : '◌ Snapshot'}
  </span>
{/if}

<style>
  .fresh { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--border); white-space: nowrap; }
  .live { color: var(--status-good); }
  .snapshot { color: var(--ink-2); }
</style>
