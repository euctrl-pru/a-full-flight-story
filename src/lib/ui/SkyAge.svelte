<script lang="ts">
  import { sky } from '$lib/data/liveState.svelte';
  import { ageLabel, minutesAgo } from '$lib/data/sky';
  import { UI } from './ui-strings';
  let now = $state(Date.now());
  $effect(() => { const id = setInterval(() => (now = Date.now()), 15_000); return () => clearInterval(id); });
  const snap = $derived(sky.snap);
  const stale = $derived(snap ? minutesAgo(snap.fetchedAt, now) > 30 : false);
  const source = $derived(snap?.source === 'adsb.lol' ? 'adsb.lol' : 'OpenSky Network');
</script>

{#if snap && snap.count > 0}
  <p class="sky-age" class:stale data-testid="sky-age">
    {UI.skyFrom(ageLabel(snap.fetchedAt, now), source)}{#if stale}<span> — {UI.skyDelayed}</span>{/if}
  </p>
{/if}

<style>
  .sky-age { margin: 4px 0 0; font-size: 13px; color: var(--ink-2); }
  .stale { color: var(--status-warning); }
</style>
