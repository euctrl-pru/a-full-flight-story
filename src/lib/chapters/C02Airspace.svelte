<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { EUROPE_FRAME, ROUTE_FRAME } from '$lib/geo/projection';
  import { ISO } from '$lib/geo/countries';
  import { AIRPORTS, ROUTE_PLANNED } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('airspace');
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label={msg('fig_airspace_map')} frame={EUROPE_FRAME} frameTo={ROUTE_FRAME} t={step === 0 ? progress : 1}
          highlight={[ISO.BE, ISO.LU, ISO.FR, ISO.CH, ISO.IT]}>
          {#snippet children({ projection, path, width })}
            <RouteMap {projection} {path} {width} showPlane={false} progress={step === 0 ? progress : 1}
              routes={[
                ...(step >= 1 ? [{ id: 'gc', coords: [AIRPORTS.EBBR.lonlat, AIRPORTS.LIRF.lonlat], style: 'ghost' as const }] : []),
                { id: 'planned', coords: ROUTE_PLANNED, style: 'active' as const }
              ]} />
          {/snippet}
        </BaseMap>
      </div>
      <SourceLine ids={['D-naturalearth', 'S17', 'S18']} illustrative detail={step >= 1 ? msg('fig_airspace_detail') : undefined} />
    </div>
  {/snippet}
</Chapter>
