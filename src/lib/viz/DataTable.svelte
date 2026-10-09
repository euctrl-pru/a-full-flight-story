<script lang="ts">
  import type { TableSpec } from './types';
  let { spec, maxRows = 400 }: { spec: TableSpec; maxRows?: number } = $props();
</script>

<details class="dt">
  <summary>Show data table</summary>
  <div class="scroll">
    <table>
      <caption class="visually-hidden">{spec.caption}</caption>
      <thead><tr>{#each spec.columns as c}<th scope="col">{c.label}</th>{/each}</tr></thead>
      <tbody>
        {#each spec.rows.slice(0, maxRows) as r}
          <tr>{#each spec.columns as c}<td>{c.format ? c.format(r[c.key]) : String(r[c.key] ?? '')}</td>{/each}</tr>
        {/each}
      </tbody>
    </table>
    {#if spec.rows.length > maxRows}<p class="more">Showing the first {maxRows} of {spec.rows.length} rows.</p>{/if}
  </div>
</details>

<style>
  .dt { margin-top: 6px; font-size: 13px; }
  summary { cursor: pointer; color: var(--ink-2); }
  .scroll { max-height: 260px; overflow: auto; margin-top: 6px; border: 1px solid var(--border); border-radius: 8px; }
  table { border-collapse: collapse; width: 100%; font-variant-numeric: tabular-nums; }
  th, td { padding: 4px 8px; text-align: left; border-bottom: 1px solid var(--grid); white-space: nowrap; }
  th { position: sticky; top: 0; background: var(--surface-2); }
</style>
