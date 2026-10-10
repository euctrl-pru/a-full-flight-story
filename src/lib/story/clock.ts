import { msg } from '$lib/i18n/msg';

const tick = (pos: number, id: string) => ({ pos, get label() { return msg(`clock_tick_${id}`); } });
export const CLOCK_TICKS = [
  tick(0, 'start'), tick(0.14, 'season'), tick(0.27, 'd6'), tick(0.37, 'd1'), tick(0.5, 'eobt3h'),
  tick(0.62, 'offblock'), tick(0.72, 'airborne'), tick(0.86, 'onblock'), tick(1, 'postops')
];
