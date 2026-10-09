<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import StakeholderMatrix from '$lib/viz/StakeholderMatrix.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { co2Lines, trafficLines, linesTable, dayNumLabel } from '$lib/story/derive';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import { ENTITIES, type EntityKey } from '$lib/data/eurocontrol';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('postops');
  const net = $derived(bundle('network'));
  const ANSPS: EntityKey[] = ['skeyes', 'MUAC', 'DSNA', 'DFS', 'Skyguide', 'ENAV'];
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      {#if step <= 2}
        <Figure title="Who touched FFS101, and when" subtitle="Each dot: a stakeholder acting in a phase (hover for details)" sources={['S7', 'S13', 'S8']} illustrative>
          <StakeholderMatrix upTo={step === 0 ? 'arrival' : 'postops'} />
        </Figure>
      {:else if step === 3}
        <Figure title="CO₂ and departures, indexed" subtitle="EUROCONTROL Data app monthly indices" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
          table={linesTable(co2Lines(net), 'Month', dayNumLabel, (v) => fmtDec(v, 1), 'CO2 and departures indices')}>
          <LineChart series={co2Lines(net)} label="CO2 index and departures index" xFormat={dayNumLabel} xTickWidth={130} yFormat={(v) => fmtDec(v, 0)} />
        </Figure>
      {:else}
        <div class="sm">
          {#each ANSPS as k (k)}
            {@const b = bundle(k)}
            <div class="cell panel">
              <h4>{ENTITIES[k].label}</h4>
              <LineChart series={trafficLines(b, [2019, 2026])} label="{ENTITIES[k].label} daily flights 2026 vs 2019" height={110} xFormat={doyLabel} yFormat={fmtInt} directLabels={false} xTicks={[1, 182]} yTicks={2} />
            </div>
          {/each}
        </div>
        <SourceLine ids={['D-eurocontrol']} detail="daily flights handled, 7-day average; blue 2026, grey 2019" freshness={ec.freshness.MUAC ?? null} dataDate={bundle('MUAC')?.dataDate} />
      {/if}
    </div>
  {/snippet}
</Chapter>

<style>
  .sm { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; overflow: auto; }
  .cell { padding: 10px; }
  h4 { margin: 0 0 4px; font-size: 13px; font-weight: 650; }
</style>
