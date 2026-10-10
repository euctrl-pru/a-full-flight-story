<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { geoPath, geoGraticule10, type GeoProjection, type GeoPath } from 'd3-geo';
  import { loadCountries, type CountryFC } from '$lib/geo/countries';
  import { EUROPE_FRAME, lerpProjection, makeProjection } from '$lib/geo/projection';
  import { projectionTransform } from '$lib/geo/map-transform';
  import { dur } from '$lib/scroll/motion';

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
  // base layer: projected once per size, then zoomed with an exact transform
  const base = $derived(makeProjection(width, height, EUROPE_FRAME));
  const basePath = $derived(geoPath(base));
  // closures (not plain expressions) so TypeScript does not narrow `countries` to its initial null
  const land = $derived.by(() => {
    const fc = countries;
    return fc ? basePath({ type: 'FeatureCollection', features: fc.features.filter((f) => !highlight.includes(String(f.id))) } as any) ?? '' : '';
  });
  const hl = $derived.by(() => {
    const fc = countries;
    return fc ? basePath({ type: 'FeatureCollection', features: fc.features.filter((f) => highlight.includes(String(f.id))) } as any) ?? '' : '';
  });
  const grat = $derived(basePath(geoGraticule10()));
  const tf = $derived(projectionTransform(base, projection).transform);
</script>

<div class="map" bind:clientWidth={width} bind:clientHeight={height}>
  {#if width > 0 && height > 0}
    <svg {width} {height} role="img" aria-label={label}>
      <g transform={tf}>
        <path class="graticule" d={grat} />
        {#if countries}
          <path class="country" d={land} />
          {#if hl}<path class="country hl" d={hl} />{/if}
        {/if}
      </g>
      {@render children?.(ctx)}
    </svg>
    {@render overlay?.(ctx)}
  {/if}
</div>

<style>
  .map { position: relative; width: 100%; height: 100%; }
  svg { display: block; }
  .graticule { fill: none; stroke: var(--grid); stroke-width: 0.5; vector-effect: non-scaling-stroke; }
  .country { fill: var(--surface-2); stroke: var(--axis); stroke-width: 0.6; vector-effect: non-scaling-stroke; }
  .country.hl { fill: color-mix(in srgb, var(--accent) 14%, var(--surface-2)); }
</style>
