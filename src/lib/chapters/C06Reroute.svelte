<script lang="ts">
  import { onMount } from 'svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import BaseMap from '$lib/viz/BaseMap.svelte';
  import RouteMap from '$lib/viz/RouteMap.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ROUTE_FRAME } from '$lib/geo/projection';
  import { loadCountries } from '$lib/geo/countries';
  import { routeLengthKm } from '$lib/geo/route';
  import { ROUTE_PLANNED, ROUTE_REROUTED, HERO, countrySpans } from '$lib/story/flight';
  import { routeCharges, type ZoneCharge } from '$lib/sim/charges';
  import { ZONES } from '$lib/story/charges-data';
  import { fmtInt } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('reroute');
  let charges: { planned: ZoneCharge[]; rerouted: ZoneCharge[] } | null = $state(null);
  onMount(async () => {
    const fc = await loadCountries();
    charges = {
      planned: routeCharges(await countrySpans(ROUTE_PLANNED, fc), ZONES, HERO.mtowT),
      rerouted: routeCharges(await countrySpans(ROUTE_REROUTED, fc), ZONES, HERO.mtowT)
    };
  });
  const sum = (z: ZoneCharge[]) => z.reduce((s, x) => s + x.charge, 0);
  const extraKm = Math.round(routeLengthKm(ROUTE_REROUTED) - routeLengthKm(ROUTE_PLANNED));
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="map-wrap">
        <BaseMap label="Planned route through the regulated sector and the proposed reroute" frame={ROUTE_FRAME}>
          {#snippet children({ projection, path })}
            <RouteMap {projection} {path} regulated showPlane={false}
              progress={step === 1 ? progress : 1}
              routes={step < 3
                ? [{ id: 'planned', coords: ROUTE_PLANNED, style: 'ghost' }, ...(step >= 1 ? [{ id: 'rrp', coords: ROUTE_REROUTED, style: 'active' as const }] : [])]
                : [{ id: 'planned', coords: ROUTE_PLANNED, style: 'ghost' }, { id: 'flown', coords: ROUTE_REROUTED, style: 'active' }]} />
          {/snippet}
        </BaseMap>
        {#if step === 2 && charges}
          <table class="panel decision">
            <caption>Planned vs rerouted (illustrative)</caption>
            <thead><tr><th></th><th>Via Reims</th><th>Via Karlsruhe</th></tr></thead>
            <tbody>
              <tr><th scope="row">ATFM delay</th><td>+{HERO.ctotDelayMin} min</td><td>+{HERO.rerouteCtotDelayMin} min</td></tr>
              <tr><th scope="row">Extra distance</th><td>—</td><td>+{extraKm} km</td></tr>
              <tr><th scope="row">En-route charges</th><td>€{fmtInt(sum(charges.planned))}</td><td>€{fmtInt(sum(charges.rerouted))}</td></tr>
            </tbody>
          </table>
        {/if}
      </div>
      <SourceLine ids={step === 2 ? ['S7', 'S3', 'S34', 'D-naturalearth'] : ['S7', 'S1', 'D-naturalearth']} illustrative />
    </div>
  {/snippet}
</Chapter>

<style>
  .decision { position: absolute; right: 16px; bottom: 16px; font-size: 14px; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  .decision caption { text-align: left; font-weight: 650; padding-bottom: 6px; }
  .decision th, .decision td { padding: 4px 10px; text-align: left; border-bottom: 1px solid var(--grid); }
</style>
