import type { Actor, Phase, FlightEvent } from './flight';

export const PHASES: { id: Phase; label: string }[] = [
  { id: 'strategic', label: 'Strategic' }, { id: 'pretactical', label: 'Pre-tactical' }, { id: 'filing', label: 'Filing' },
  { id: 'tactical', label: 'Tactical' }, { id: 'ground', label: 'Ground' }, { id: 'departure', label: 'Departure' },
  { id: 'enroute', label: 'En route' }, { id: 'arrival', label: 'Arrival' }, { id: 'postops', label: 'Post-ops' }
];

/** Roles from research §11. */
export const ACTORS: { id: Actor; label: string; role: string; sources: string[] }[] = [
  { id: 'airline', label: 'Airline (OCC & dispatch)', role: 'Plans the schedule, requests slots, files and updates the flight plan, answers SAM/RRP, pays route charges.', sources: ['S7', 'S9'] },
  { id: 'slot-coordinator', label: 'Slot coordinators', role: 'BSC (Brussels) and Assoclearance (Rome) allocate airport slots under EU Regulation 95/93.', sources: ['S21', 'S26', 'S27'] },
  { id: 'network-manager', label: 'Network Manager (EUROCONTROL)', role: 'Designs the route network, plans and manages flow, issues ATFM slots.', sources: ['S7', 'S20'] },
  { id: 'ifps', label: 'IFPS', role: 'Validates and distributes every flight plan from Brussels.', sources: ['S9', 'S10'] },
  { id: 'fmp', label: 'Flow Management Positions', role: 'Each ANSP’s flow unit; agrees regulations with the Network Manager.', sources: ['S7', 'S8'] },
  { id: 'military', label: 'Military (AMC)', role: 'Books reserved airspace day by day through the Airspace Use Plan.', sources: ['S19', 'S28'] },
  { id: 'airport', label: 'Airport operators', role: 'Brussels Airport and Aeroporti di Roma run the infrastructure and the A-CDM platform.', sources: ['S13', 'S16'] },
  { id: 'ground-handler', label: 'Ground handlers', role: 'Turn the aircraft around and keep the TOBT honest.', sources: ['S13'] },
  { id: 'passengers', label: 'Passengers', role: 'Board on time — and feel every minute of delay.', sources: ['S1'] },
  { id: 'pilots', label: 'Pilots', role: 'Brief, request start-up, fly the clearance and the slot.', sources: ['S7'] },
  { id: 'ansp', label: 'Air navigation service providers', role: 'skeyes, MUAC, DSNA/DFS, skyguide and ENAV control the flight sector by sector.', sources: ['S5', 'S28', 'S30'] },
  { id: 'crco', label: 'CRCO (EUROCONTROL)', role: 'Bills the en-route charges for every state crossed.', sources: ['S32'] },
  { id: 'prc', label: 'Performance Review Commission', role: 'Independently reviews how Europe’s ATM system performed.', sources: ['S37'] }
];

export function matrix(events: FlightEvent[]) {
  return ACTORS.flatMap((a) =>
    PHASES.map((p) => ({ actor: a.id, phase: p.id, events: events.filter((e) => e.actor === a.id && e.phase === p.id) }))
  ).filter((c) => c.events.length > 0);
}
