import { describe, it, expect } from 'vitest';
import { stackRows, spreadAlong } from '$lib/viz/label-layout';

describe('label layout', () => {
  it('stackRows puts overlapping labels on new rows and reuses free rows', () => {
    expect(stackRows([{ x: 0, w: 50 }, { x: 20, w: 50 }, { x: 60, w: 10 }, { x: 200, w: 10 }], 4)).toEqual([0, 1, 0, 0]);
  });
  it('spreadAlong enforces a minimum gap, preserving order', () => {
    expect(spreadAlong([0, 5, 6, 100], 10)).toEqual([0, 10, 20, 100]);
  });
});
