import { readFileSync, writeFileSync } from 'node:fs';
import { feature, quantize } from 'topojson-client';
import { topology } from 'topojson-server';
import { presimplify, simplify, quantile } from 'topojson-simplify';
import { geoBounds } from 'd3-geo';

const world = JSON.parse(readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const fc = feature(world, world.objects.countries) as unknown as GeoJSON.FeatureCollection;
const [W, S, E, N] = [-30, 25, 50, 72];
const keep = fc.features.filter((f) => {
  const [[w, s], [e, n]] = geoBounds(f as any);
  const lonOk = w > e /* crosses antimeridian */ || (e >= W && w <= E);
  return lonOk && n >= S && s <= N;
});
const P = Number(process.env.GEO_P ?? 0.4); // fraction of points kept (topojson-simplify quantile); 0.4 → ~112 KiB, under the 120 KiB budget
const pre = presimplify(topology({ countries: { type: 'FeatureCollection', features: keep } } as any) as any);
const simp = simplify(pre, quantile(pre, P)) as any;
// presimplify leaves a float weight on every point and drops quantization: strip it and re-quantize
simp.arcs = simp.arcs.map((arc: number[][]) => arc.map(([x, y]) => [x, y]));
const out = quantize(simp, 1e4);
const body = JSON.stringify(out);
writeFileSync('src/lib/geo/europe.topo.json', body);
console.log(`europe.topo.json: ${keep.length} countries, ${(body.length / 1024).toFixed(0)} KiB (P=${P})`);
