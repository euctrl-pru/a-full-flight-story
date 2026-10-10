<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import { msg } from '$lib/i18n/msg';
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import StakeholderMatrix from '$lib/viz/StakeholderMatrix.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { co2Lines, trafficLines, linesTable, dayNumLabel } from '$lib/story/derive';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import type { EntityKey } from '$lib/data/eurocontrol';
  import { chapter } from '$lib/story/chapters';
  import { currentYear } from '$lib/story/freshness';

  const ch = chapter('postops');
  const net = $derived(bundle('network'));
  const cy = $derived(currentYear(net?.dataDate));
  const ANSPS: EntityKey[] = ['skeyes', 'MUAC', 'DSNA', 'DFS', 'Skyguide', 'ENAV'];
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <div class="swaps">
      {#if step <= 2}
        <Swap>
          <Figure title={msg('fig_who_title')} subtitle={msg('fig_who_sub')} sources={['S7', 'S13', 'S8']} illustrative>
            <StakeholderMatrix upTo={step === 0 ? 'arrival' : 'postops'} />
          </Figure>
        </Swap>
      {:else if step === 3}
        <Swap>
          <Figure title={msg('fig_co2_title')} subtitle={msg('fig_co2_sub')} sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
            table={linesTable(co2Lines(net), msg('ui_col_month'), dayNumLabel, (v) => fmtDec(v, 1), msg('fig_co2_caption'))}>
            <LineChart series={co2Lines(net)} label={msg('fig_co2_label')} xFormat={dayNumLabel} xTickWidth={130} yFormat={(v) => fmtDec(v, 0)} />
          </Figure>
        </Swap>
      {:else}
        <Swap>
          <div class="sm">
            {#each ANSPS as k (k)}
              {@const b = bundle(k)}
              <div class="cell panel">
                <h4>{msg(`ent_${k}`)}</h4>
                <LineChart series={trafficLines(b, [2019, cy], cy)} label={msg('fig_anspgrid_label', { name: msg(`ent_${k}`), year: cy })} height={110} xFormat={doyLabel} yFormat={fmtInt} directLabels={false} xTicks={[1, 182]} yTicks={2} />
              </div>
            {/each}
          </div>
          <SourceLine ids={['D-eurocontrol']} detail={msg('fig_anspgrid_detail', { year: cy })} freshness={ec.freshness.MUAC ?? null} dataDate={bundle('MUAC')?.dataDate} />
        </Swap>
      {/if}
      </div>
    </div>
  {/snippet}
</Chapter>

<style>
  .sm { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; overflow: auto; }
  .cell { padding: 10px; }
  h4 { margin: 0 0 4px; font-size: 13px; font-weight: 650; }
</style>
