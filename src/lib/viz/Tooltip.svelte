<script lang="ts">
  import type { Snippet } from 'svelte';
  let { visible, x, y, containerWidth, children }: { visible: boolean; x: number; y: number; containerWidth: number; children: Snippet } = $props();
  const flip = $derived(x > containerWidth * 0.6);
</script>

{#if visible}
  <div class="tooltip" role="status" style:left="{x}px" style:top="{y}px" style:transform={flip ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)'}>
    {@render children()}
  </div>
{/if}

<style>
  .tooltip { position: absolute; pointer-events: none; z-index: 5; background: var(--surface-2); color: var(--ink); border: 1px solid var(--border); border-radius: 8px; padding: 8px 10px; font-size: 13px; line-height: 1.4; min-width: 150px; box-shadow: 0 6px 24px rgb(0 0 0 / 0.25); }
  .tooltip :global(.row) { display: flex; gap: 6px; align-items: center; }
  .tooltip :global(.sw) { width: 10px; height: 10px; border-radius: 2px; flex: none; }
  .tooltip :global(.v) { margin-left: auto; padding-left: 12px; font-variant-numeric: tabular-nums; }
</style>
