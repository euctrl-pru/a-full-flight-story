import { describe, it, expect } from 'vitest';
import { scenario, REGULATION } from '$lib/story/scenario';
import { HERO } from '$lib/story/flight';

describe('hero scenario', () => {
  it('gives FFS101 exactly the story delay at the manual rate', () => {
    expect(scenario().hero.delay).toBe(HERO.ctotDelayMin);
    expect(scenario().hero.regulated).toBe(true);
  });
  it('more capacity means less delay for the hero', () => {
    expect(scenario(REGULATION.rate + 8).hero.delay).toBeLessThan(HERO.ctotDelayMin);
    expect(scenario(60).hero.delay).toBe(0);
  });
});
