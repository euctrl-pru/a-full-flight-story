<script lang="ts">
  import type { Freshness } from '$lib/data/live';
  import { msg } from '$lib/i18n/msg';
  let { freshness }: { freshness: Freshness | null } = $props();
</script>

{#if freshness}
  <span class="fresh {freshness}" title={msg(freshness === 'live' ? 'ui_fresh_live_title' : 'ui_fresh_snapshot_title')}>
    {msg(freshness === 'live' ? 'ui_fresh_live' : 'ui_fresh_snapshot')}
  </span>
{/if}

<style>
  .fresh { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--border); white-space: nowrap; }
  .live { color: var(--status-good); }
  .snapshot { color: var(--ink-2); }
</style>
