import { msg, keyOf } from '$lib/i18n/msg';
import type { Actor, Phase, FlightEvent } from './flight';

const phase = (id: Phase) => ({ id, get label() { return msg(`sp_${id}`); } });
export const PHASES: { id: Phase; label: string }[] = (
  ['strategic', 'pretactical', 'filing', 'tactical', 'ground', 'departure', 'enroute', 'arrival', 'postops'] as Phase[]
).map(phase);

/** Roles from research §11. */
const actor = (id: Actor, sources: string[]) => ({
  id, sources,
  get label() { return msg(`ac_${keyOf(id)}_label`); },
  get role() { return msg(`ac_${keyOf(id)}_role`); }
});
export const ACTORS: { id: Actor; label: string; role: string; sources: string[] }[] = [
  actor('airline', ['S7', 'S9']),
  actor('slot-coordinator', ['S21', 'S26', 'S27']),
  actor('network-manager', ['S7', 'S20']),
  actor('ifps', ['S9', 'S10']),
  actor('fmp', ['S7', 'S8']),
  actor('military', ['S19', 'S28']),
  actor('airport', ['S13', 'S16']),
  actor('ground-handler', ['S13']),
  actor('passengers', ['S1']),
  actor('pilots', ['S7']),
  actor('ansp', ['S5', 'S28', 'S30']),
  actor('crco', ['S32']),
  actor('prc', ['S37'])
];

export function matrix(events: FlightEvent[]) {
  return ACTORS.flatMap((a) =>
    PHASES.map((p) => ({ actor: a.id, phase: p.id, events: events.filter((e) => e.actor === a.id && e.phase === p.id) }))
  ).filter((c) => c.events.length > 0);
}
