<script lang="ts">
  import { onMount } from 'svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import ProfileChart from '$lib/viz/ProfileChart.svelte';
  import ChargesBar from '$lib/viz/ChargesBar.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME } from '$lib/geo/projection';
  import { loadCountries } from '$lib/geo/countries';
  import type { Span } from '$lib/geo/route';
  import { ROUTE_PLANNED, ROUTE_REROUTED, HERO, anspSpans, countrySpans, type AnspKey } from '$lib/story/flight';
  import { routeCharges, type ZoneCharge } from '$lib/sim/charges';
  import { ZONES } from '$lib/story/charges-data';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('enroute');
  const KEY = [0.04, 0.2, 0.75, 1, 1];
  let spans: Span<AnspKey>[] = $state([]);
  let charges: { planned: ZoneCharge[]; rerouted: ZoneCharge[] } | null = $state(null);
  onMount(async () => {
    const fc = await loadCountries();
    spans = anspSpans(ROUTE_REROUTED, fc);
    charges = {
      planned: routeCharges(await countrySpans(ROUTE_PLANNED, fc), ZONES, HERO.mtowT),
      rerouted: routeCharges(await countrySpans(ROUTE_REROUTED, fc), ZONES, HERO.mtowT)
    };
  });
  const along = (step: number, p: number) => KEY[step] + ((KEY[step + 1] ?? 1) - KEY[step]) * p;
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      {#if step <= 2}
        <div class="map-wrap">
          <BaseMap label="FFS101 en route, coloured by the air navigation service provider in control" frame={ROUTE_FRAME}>
            {#snippet children({ projection, path })}
              <RouteMap {projection} {path} showAnsp progress={along(step, progress)} routes={[{ id: 'flown', coords: ROUTE_REROUTED, spans, style: 'active' }]} />
            {/snippet}
          </BaseMap>
        </div>
        <ProfileChart route={ROUTE_REROUTED} {spans} progress={along(step, progress)} />
        <SourceLine ids={['S28', 'S5', 'S30', 'D-naturalearth']} illustrative detail="ANSP assignment approximated from country and flight level" />
      {:else if charges}
        <Figure title="Who gets paid: en-route charges by zone" subtitle="A320neo (MTOW 79 t), unit rates for October 2026" sources={['S32', 'S33', 'S34', 'S35']} illustrative
          table={{ caption: 'Route charges by zone', columns: [{ key: 'route', label: 'Route' }, { key: 'zone', label: 'Zone' }, { key: 'km', label: 'km' }, { key: 'charge', label: '€' }],
            rows: [...charges.planned.map((z) => ({ route: 'Planned', zone: z.zone.label, km: z.km, charge: z.charge })), ...charges.rerouted.map((z) => ({ route: 'Rerouted', zone: z.zone.label, km: z.km, charge: z.charge }))] }}>
          <ChargesBar planned={charges.planned} rerouted={charges.rerouted} mode={step === 3 ? 'distance' : 'compare'} />
        </Figure>
      {/if}
    </div>
  {/snippet}
</Chapter>
