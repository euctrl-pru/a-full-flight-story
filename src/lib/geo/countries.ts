import type { Topology } from 'topojson-specification';

export const ISO = { BE: '056', LU: '442', NL: '528', FR: '250', DE: '276', CH: '756', IT: '380' } as const;
export type CountryFC = GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>;

let cache: Promise<CountryFC> | null = null;
export function loadCountries(): Promise<CountryFC> {
  cache ??= Promise.all([import('topojson-client'), import('world-atlas/countries-50m.json')]).then(
    ([{ feature }, world]) => {
      const topo = ((world as any).default ?? world) as Topology;
      return feature(topo, topo.objects.countries) as unknown as CountryFC;
    }
  );
  return cache;
}

export function regionsFor(fc: CountryFC, isos: string[]) {
  return fc.features.filter((f) => isos.includes(String(f.id))).map((f) => ({ id: String(f.id), feature: f as GeoJSON.Feature }));
}
