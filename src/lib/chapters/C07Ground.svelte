<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import { msg } from '$lib/i18n/msg';
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import AcdmTimeline from '$lib/viz/AcdmTimeline.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { punctualityLines, linesTable, dayNumLabel } from '$lib/story/derive';
  import { fmtDec } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('ground');
  const STAGES = ['milestones', 'turnaround', 'milestones', 'window'] as const;
  const ebbr = $derived(bundle('EBBR'));
  const lines = $derived(punctualityLines(ebbr, 365));
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <div class="swaps">
      {#if step <= 3}
        <Swap>
          <Figure title={msg('fig_ground_title')} subtitle={msg('fig_ground_sub')} sources={['S13', 'S7']} illustrative>
            <AcdmTimeline stage={STAGES[step]} />
          </Figure>
        </Swap>
      {:else}
        <Swap>
          <Figure title={msg('fig_bru_punct_title')} subtitle={msg('fig_bru_punct_sub')} sources={['D-eurocontrol']} detail={msg('fig_bru_punct_detail')} freshness={ec.freshness.EBBR ?? null} dataDate={ebbr?.dataDate}
            table={linesTable(lines, msg('ui_col_date'), dayNumLabel, (v) => fmtDec(v, 1), msg('fig_bru_punct_caption'))}>
            <LineChart series={lines} label={msg('fig_bru_punct_label')} xFormat={dayNumLabel} xTickWidth={130} yFormat={(v) => `${Math.round(v)}%`} yDomain={[0, 100]} />
          </Figure>
        </Swap>
      {/if}
      </div>
    </div>
  {/snippet}
</Chapter>
