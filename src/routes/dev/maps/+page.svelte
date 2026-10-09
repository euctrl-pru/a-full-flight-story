<script lang="ts">
  import { onMount } from 'svelte';
  import { startLoading, sky } from '$lib/data/liveState.svelte';
  import { loadCountries, type CountryFC } from '$lib/geo/countries';
  import { ROUTE_FRAME, EUROPE_FRAME } from '$lib/geo/projection';
  import { ROUTE_PLANNED, ROUTE_REROUTED, anspSpans } from '$lib/story/flight';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import SkyCanvas from '$lib/viz/SkyCanvas.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';

  let fc: CountryFC | null = $state(null);
  let progress = $state(0.6);
  onMount(() => { startLoading(); loadCountries().then((c) => (fc = c)); });
  const spans = $derived(fc ? anspSpans(ROUTE_REROUTED, fc) : []);
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<div class="box">
  <BaseMap label="Aircraft over Europe" frame={EUROPE_FRAME}>
    {#snippet overlay({ projection, width, height })}
      {#if sky.snap}<SkyCanvas aircraft={sky.snap.aircraft} {projection} {width} {height} />{/if}
    {/snippet}
  </BaseMap>
</div>
<input type="range" min="0" max="1" step="0.01" bind:value={progress} aria-label="Progress" />
<div class="box">
  <BaseMap label="FFS101 route" frame={ROUTE_FRAME} highlight={['056', '442', '250', '276', '756', '380']}>
    {#snippet children({ projection, path, width })}
      <RouteMap {projection} {path} {width} {progress} showAnsp military regulated routes={[
        { id: 'planned', coords: ROUTE_PLANNED, style: 'ghost' },
        { id: 'flown', coords: ROUTE_REROUTED, spans, style: 'active' }
      ]} />
    {/snippet}
  </BaseMap>
</div>

<style>
  .box { height: 70vh; position: relative; }
</style>
