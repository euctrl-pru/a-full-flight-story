<script lang="ts">
  import { getSource } from '$lib/story/sources';
  let { ids }: { ids: string[] } = $props();
  const items = $derived(ids.map((id) => ({ id, s: getSource(id), label: id.startsWith('S') ? id.slice(1) : 'data' })));
</script>

<sup class="cites">
  {#each items as { id, s, label } (id)}
    <a class="cite" href={s.url} target="_blank" rel="noopener noreferrer" aria-label="Source {label}: {s.title}, {s.publisher}">
      {label}<span class="tip" role="tooltip"><strong>{s.publisher}</strong><br />{s.title}</span>
    </a>
  {/each}
</sup>

<style>
  .cites { display: inline-flex; gap: 2px; margin-left: 2px; vertical-align: super; line-height: 1; }
  .cite { position: relative; font-size: 11px; font-weight: 600; padding: 1px 5px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--ink); text-decoration: none; }
  .cite:hover, .cite:focus-visible { background: var(--accent); color: #fff; }
  .tip { display: none; position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); width: max-content; max-width: 260px; padding: 8px 10px; background: var(--surface-2); color: var(--ink); border: 1px solid var(--border); border-radius: 8px; font-size: 12px; font-weight: 400; line-height: 1.35; z-index: 20; white-space: normal; text-align: left; }
  .cite:hover .tip, .cite:focus-visible .tip { display: block; }
</style>
