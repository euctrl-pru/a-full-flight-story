<script lang="ts">
  let { items }: { items: { label: string; color: string; dash?: string }[] } = $props();
</script>

<ul class="legend">
  {#each items as it (it.label)}
    <li><svg width="18" height="10" aria-hidden="true"><line x1="0" x2="18" y1="5" y2="5" stroke={it.color} stroke-width="3" stroke-dasharray={it.dash} stroke-linecap="round" /></svg>{it.label}</li>
  {/each}
</ul>

<style>
  .legend { display: flex; flex-wrap: wrap; gap: 4px 14px; list-style: none; margin: 0 0 6px; padding: 0; font-size: 13px; color: var(--ink-2); }
  li { display: flex; align-items: center; gap: 6px; }
</style>
