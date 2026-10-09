<script lang="ts">
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
      {#if step <= 3}
        <Figure title="FFS101 at Brussels: turnaround and A-CDM milestones" subtitle="Times UTC" sources={['S13', 'S7']} illustrative>
          <AcdmTimeline stage={STAGES[step]} />
        </Figure>
      {:else}
        <Figure title="Brussels Airport punctuality" subtitle="% of flights within 15 minutes of schedule, last 12 months" sources={['D-eurocontrol']} detail="Brussels (EBBR)" freshness={ec.freshness.EBBR ?? null} dataDate={ebbr?.dataDate}
          table={linesTable(lines, 'Date', dayNumLabel, (v) => fmtDec(v, 1), 'Brussels punctuality')}>
          <LineChart series={lines} label="Brussels departure and arrival punctuality" xFormat={dayNumLabel} xTickWidth={130} yFormat={(v) => `${Math.round(v)}%`} yDomain={[0, 100]} />
        </Figure>
      {/if}
    </div>
  {/snippet}
</Chapter>
