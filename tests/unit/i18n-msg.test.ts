import { describe, it, expect } from 'vitest';
import { msg, keyOf, withLocale, intlLocale } from '$lib/i18n/msg';
import { localeHref, LOCALES } from '$lib/i18n/locales';

describe('i18n helpers', () => {
  it('looks up messages in the active locale', () => {
    expect(withLocale('en', () => msg('site_title'))).toBe('A Full Flight Story');
    expect(withLocale('de', () => msg('site_title'))).toBe('Ein ganzer Flug');
  });
  it('throws on unknown keys', () => expect(() => msg('nope_nope')).toThrow(/Missing message/));
  it('keys ids safely', () => expect(keyOf('A-CDM')).toBe('A_CDM'));
  it('maps Intl locales', () => { expect(intlLocale('en')).toBe('en-GB'); expect(intlLocale('pl')).toBe('pl'); });
  it('lists six locales with native names and builds hrefs', () => {
    expect(LOCALES.map((l) => l.name)).toEqual(['English', 'Deutsch', 'Français', 'Italiano', 'Español', 'Polski']);
    expect(localeHref('en')).toBe('/');
    expect(localeHref('fr')).toBe('/fr/');
  });
});
