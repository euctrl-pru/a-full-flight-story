import type { LonLat } from '$lib/geo/route';
import { HERO, ROUTE_PLANNED } from './flight';

export interface FplField { item: string; label: string; value: string }

function dm(v: number, degDigits: number): [string, number] {
  const totalMin = Math.round(Math.abs(v) * 60);
  return [String(Math.floor(totalMin / 60)).padStart(degDigits, '0') + String(totalMin % 60).padStart(2, '0'), Math.sign(v)];
}
export function fplCoord([lon, lat]: LonLat): string {
  const [la, ls] = dm(lat, 2), [lo, os] = dm(lon, 3);
  return `${la}${ls < 0 ? 'S' : 'N'}${lo}${os < 0 ? 'W' : 'E'}`;
}

/** `lines`: each inner array is one dash-separated line of the message. */
export function buildFpl(lines: FplField[][]) {
  let text = '(FPL';
  const spans: { item: string; label: string; start: number; end: number }[] = [];
  lines.forEach((fields, li) => {
    text += li === 0 ? '' : '\n';
    for (const f of fields) {
      text += '-';
      spans.push({ item: f.item, label: f.label, start: text.length, end: text.length + f.value.length });
      text += f.value;
    }
  });
  return { text: text + ')', spans };
}

export function heroFplFields(route: LonLat[] = ROUTE_PLANNED): FplField[][] {
  const pts = route.slice(1, -1).map(fplCoord).join(' DCT ');
  const [y, m, d] = HERO.date.split('-');
  return [
    [
      { item: '7', label: 'Aircraft identification', value: HERO.callsign },
      { item: '8', label: 'Flight rules & type: IFR, scheduled', value: 'IS' }
    ],
    [
      { item: '9', label: 'Aircraft type / wake category', value: `${HERO.aircraftType}/M` },
      { item: '10', label: 'Equipment & surveillance', value: 'SDE1E2FGHIJ1RWY/LB1' }
    ],
    [{ item: '13', label: 'Departure aerodrome + EOBT', value: `EBBR${HERO.std.replace(':', '')}` }],
    [{ item: '15', label: 'Speed, level, route', value: `N0450F${HERO.cruiseFt / 100} ${pts}` }],
    [{ item: '16', label: 'Destination, total EET, alternate', value: 'LIRF0140 LIRN' }],
    [{ item: '18', label: 'Other information', value: `PBN/A1B1C1D1O1S2 DOF/${y.slice(2)}${m}${d} REG/${HERO.registration.replace('-', '')} RMK/ILLUSTRATIVE FLIGHT` }]
  ];
}

export const HERO_FPL = buildFpl(heroFplFields());
