<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME } from '$lib/geo/projection';
  import { ISO } from '$lib/geo/countries';
  import { ROUTE_PLANNED } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('week-before');
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label="Military training areas and FFS101's planned route" frame={ROUTE_FRAME} highlight={[ISO.BE, ISO.LU, ISO.FR, ISO.CH, ISO.IT]}>
          {#snippet children({ projection, path, width })}
            <RouteMap {projection} {path} {width} military={step === 0} showPlane={false} progress={1} routes={[{ id: 'planned', coords: ROUTE_PLANNED, style: 'active' }]} />
          {/snippet}
        </BaseMap>
      </div>
      <SourceLine ids={step === 0 ? ['D-naturalearth', 'S28', 'S19'] : ['D-naturalearth', 'S8']} illustrative />
    </div>
  {/snippet}
</Chapter>
