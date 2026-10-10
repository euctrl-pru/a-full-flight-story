<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME, ROME_FRAME } from '$lib/geo/projection';
  import { ROUTE_REROUTED, ACDM } from '$lib/story/flight';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { punctualityLines, linesTable, dayNumLabel } from '$lib/story/derive';
  import { fmtDec } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('arrival');
  const lirf = $derived(bundle('LIRF'));
  const lines = $derived(punctualityLines(lirf, 365));
  const hm = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="swaps">
      {#if step === 0}
        <Swap>
          <div class="map-wrap">
            <BaseMap label="FFS101 descending into Rome Fiumicino" frame={ROUTE_FRAME} frameTo={ROME_FRAME} t={progress}>
              {#snippet children({ projection, path })}
                <RouteMap {projection} {path} progress={0.85 + 0.149 * progress} routes={[{ id: 'flown', coords: ROUTE_REROUTED, style: 'active' }]} />
              {/snippet}
            </BaseMap>
          </div>
          <SourceLine ids={['S30', 'D-naturalearth']} illustrative />
        </Swap>
      {:else if step === 1}
        <Swap>
          <Figure title="Arrival vs schedule" sources={['S1']} illustrative>
            <HeroNumber value={hm(ACDM.aibt) - hm(ACDM.sta)} label="minutes after the scheduled 07:05 — on time" format={(n) => `+${Math.round(n)}`} sub="In-block {ACDM.aibt} UTC · 76.1% of European arrivals were on time in 2025" />
          </Figure>
        </Swap>
      {:else}
        <Swap>
          <Figure title="Rome Fiumicino punctuality" subtitle="% within 15 minutes of schedule, last 12 months" sources={['D-eurocontrol']} detail="Rome Fiumicino (LIRF)" freshness={ec.freshness.LIRF ?? null} dataDate={lirf?.dataDate}
            table={linesTable(lines, 'Date', dayNumLabel, (v) => fmtDec(v, 1), 'Rome Fiumicino punctuality')}>
            <LineChart series={lines} label="Rome Fiumicino departure and arrival punctuality" xFormat={dayNumLabel} xTickWidth={130} yFormat={(v) => `${Math.round(v)}%`} yDomain={[0, 100]} />
          </Figure>
        </Swap>
      {/if}
      </div>
    </div>
  {/snippet}
</Chapter>
