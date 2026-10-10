<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { dur } from '$lib/scroll/motion';
  import { geoPath, geoGraticule10, type GeoProjection, type GeoPath } from 'd3-geo';
  import { loadCountries, type CountryFC } from '$lib/geo/countries';
  import { EUROPE_FRAME, lerpProjection, makeProjection } from '$lib/geo/projection';

  type Ctx = { projection: GeoProjection; path: GeoPath; width: number; height: number };
  let { label, frame = EUROPE_FRAME, frameTo, t = 0, highlight = [], children, overlay }: {
    label: string; frame?: GeoJSON.GeoJsonObject; frameTo?: GeoJSON.GeoJsonObject; t?: number; highlight?: string[];
    children?: Snippet<[Ctx]>; overlay?: Snippet<[Ctx]>;
  } = $props();

  let width = $state(0), height = $state(0);
  let countries: CountryFC | null = $state(null);
  onMount(() => { loadCountries().then((fc) => (countries = fc)); });
  const tt = Tween.of(() => t, { duration: dur(300) });
  const projection = $derived(frameTo ? lerpProjection(width, height, frame, frameTo, tt.current) : makeProjection(width, height, frame));
  const path = $derived(geoPath(projection));
  const ctx = $derived({ projection, path, width, height });
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0 && height > 0}
    <svg {width} {height} role="img" aria-label={label}>
      <path class="graticule" d={path(geoGraticule10())} />
      {#if countries}
        {#each countries.features as f, i (i)}
          <path class="country" class:hl={highlight.includes(String(f.id))} d={path(f)} />
        {/each}
      {/if}
      {@render children?.(ctx)}
    </svg>
    {@render overlay?.(ctx)}
  {/if}
</div>

<style>
  .map { position: relative; width: 100%; height: 100%; }
  svg { display: block; }
  .graticule { fill: none; stroke: var(--grid); stroke-width: 0.5; }
  .country { fill: var(--surface-2); stroke: var(--axis); stroke-width: 0.6; }
  .country.hl { fill: color-mix(in srgb, var(--accent) 14%, var(--surface-2)); }
</style>
