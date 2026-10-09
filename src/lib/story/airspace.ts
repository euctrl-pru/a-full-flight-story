type Poly = GeoJSON.Feature<GeoJSON.Polygon, { name: string }>;
/** Rings listed north → east → south → west so d3-geo treats them as small (clockwise) polygons. */
const box = (name: string, w: number, s: number, e: number, n: number): Poly => ({
  type: 'Feature', properties: { name },
  geometry: { type: 'Polygon', coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]] }
});

export const MILITARY_AREAS: Poly[] = [
  box('Training area (illustrative)', 4.6, 49.9, 5.9, 50.5),
  box('Training area (illustrative)', 5.6, 48.6, 6.9, 49.3),
  box('Exercise area (illustrative)', 7.3, 49.4, 8.4, 50.1)
];

export const REGULATED_SECTOR: Poly = box('Reims ACC sector group (illustrative)', 3.6, 47.9, 7.2, 49.7);
