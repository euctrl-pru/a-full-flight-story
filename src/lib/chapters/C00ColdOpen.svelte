<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import SkyCanvas from '$lib/viz/SkyCanvas.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { sky, ec, bundle } from '$lib/data/liveState.svelte';
  import { ageLabel, minutesAgo } from '$lib/data/sky';
  import { ROUTE_PLANNED } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';
  import { dayPhrase } from '$lib/story/freshness';

  const ch = chapter('cold-open');
  const net = $derived(bundle('network'));
  const stale = $derived(sky.snap ? minutesAgo(sky.snap.fetchedAt) > 360 : false);
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label="Aircraft over Europe from the latest ADS-B snapshot">
          {#snippet children({ projection, path })}
            {#if step >= 2}<RouteMap {projection} {path} routes={[{ id: 'p', coords: ROUTE_PLANNED, style: 'active' }]} progress={1} showPlane={false} />{/if}
          {/snippet}
          {#snippet overlay({ projection, width, height })}
            {#if sky.snap && sky.snap.count > 0}<SkyCanvas aircraft={sky.snap.aircraft} {projection} {width} {height} dim={step >= 2 ? 1 : 0} />{/if}
          {/snippet}
        </BaseMap>
      </div>
      <div class="hud">
        <div class="swaps">
        {#if step === 0}
          <Swap>
            {#if sky.snap && sky.snap.count > 0}
              <HeroNumber value={sky.snap.count} label="aircraft airborne over Europe" sub="snapshot {ageLabel(sky.snap.fetchedAt)}{stale ? ' — the live feed may be paused' : ''}" />
            {:else if sky.status !== 'loading'}
              <p class="empty" data-testid="sky-empty">The live sky snapshot is unavailable right now — the rest of the story is unaffected.</p>
            {/if}
            <SourceLine ids={[sky.snap?.source === 'adsb.lol' ? 'D-adsblol' : 'D-opensky', 'D-naturalearth']} />
          </Swap>
        {:else if step === 1}
          <Swap>
            <HeroNumber value={net?.headline.flights ?? null} label={`flights in the European network ${dayPhrase(net?.dataDate)}`} />
            <SourceLine ids={['D-eurocontrol']} detail="network-wide" freshness={ec.freshness.network ?? null} dataDate={net?.dataDate} />
          </Swap>
        {:else}
          <Swap>
            <p class="callout"><strong>FFS101</strong> · Brussels (EBBR) → Rome Fiumicino (LIRF)</p>
            <SourceLine ids={['D-naturalearth']} illustrative />
          </Swap>
        {/if}
        </div>
      </div>
    </div>
  {/snippet}
</Chapter>

<style>
  .callout { font-size: 22px; margin: 0; }
  .empty { margin: 0; color: var(--ink-2); }
</style>
