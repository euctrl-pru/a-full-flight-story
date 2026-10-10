<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import { msg } from '$lib/i18n/msg';
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
            <BaseMap label={msg('fig_arrival_map')} frame={ROUTE_FRAME} frameTo={ROME_FRAME} t={progress}>
              {#snippet children({ projection, path, width })}
                <RouteMap {projection} {path} {width} progress={0.85 + 0.149 * progress} routes={[{ id: 'flown', coords: ROUTE_REROUTED, style: 'active' }]} />
              {/snippet}
            </BaseMap>
          </div>
          <SourceLine ids={['S30', 'D-naturalearth']} illustrative />
        </Swap>
      {:else if step === 1}
        <Swap>
          <Figure title={msg('fig_arrival_title')} sources={['S1']} illustrative>
            <HeroNumber value={hm(ACDM.aibt) - hm(ACDM.sta)} label={msg('fig_arrival_label', { sta: ACDM.sta })} format={(n) => `+${Math.round(n)}`} sub={msg('fig_arrival_sub', { aibt: ACDM.aibt })} />
          </Figure>
        </Swap>
      {:else}
        <Swap>
          <Figure title={msg('fig_lirf_title')} subtitle={msg('fig_lirf_sub')} sources={['D-eurocontrol']} detail={msg('fig_lirf_detail')} freshness={ec.freshness.LIRF ?? null} dataDate={lirf?.dataDate}
            table={linesTable(lines, msg('ui_col_date'), dayNumLabel, (v) => fmtDec(v, 1), msg('fig_lirf_caption'))}>
            <LineChart series={lines} label={msg('fig_lirf_label')} xFormat={dayNumLabel} xTickWidth={130} yFormat={(v) => `${Math.round(v)}%`} yDomain={[0, 100]} />
          </Figure>
        </Swap>
      {/if}
      </div>
    </div>
  {/snippet}
</Chapter>
