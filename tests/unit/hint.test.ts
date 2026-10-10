import { describe, it, expect } from 'vitest';
import { preferredSupported } from '$lib/i18n/hint';

describe('preferredSupported', () => {
  it('picks the first supported non-English language before any English preference', () => {
    expect(preferredSupported(['fr-BE', 'en'])).toBe('fr');
    expect(preferredSupported(['nl', 'pl-PL'])).toBe('pl');
  });
  it('stays quiet when English comes first or nothing matches', () => {
    expect(preferredSupported(['en-GB', 'de'])).toBeNull();
    expect(preferredSupported(['nl', 'sv'])).toBeNull();
    expect(preferredSupported([])).toBeNull();
  });
});
