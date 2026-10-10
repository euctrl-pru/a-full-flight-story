<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import type { TableSpec } from './types';
  let { spec, maxRows = 400 }: { spec: TableSpec; maxRows?: number } = $props();
</script>

<details class="dt">
  <summary>{msg('ui_show_table')}</summary>
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
    {#if spec.rows.length > maxRows}<p class="more">{msg('ui_table_more', { max: maxRows, total: spec.rows.length })}</p>{/if}
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
