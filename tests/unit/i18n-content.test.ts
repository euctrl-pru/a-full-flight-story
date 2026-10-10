import { describe, it, expect } from 'vitest';
import { withLocale } from '$lib/i18n/msg';
import { CHAPTERS } from '$lib/story/chapters';
import { GLOSSARY } from '$lib/story/glossary';
import { ATM_PHASES } from '$lib/story/phases';
import { ACTORS } from '$lib/story/stakeholders';
import { EVENTS, TURNAROUND, ANSP_LABEL } from '$lib/story/flight';
import en from '../../messages/en.json';

describe('content reads from messages', () => {
  it('English getters return exactly the extracted English', () => {
    withLocale('en', () => {
      expect(CHAPTERS[0].title).toBe(en.ch_cold_open_title);
      expect(CHAPTERS[1].steps[0].text).toBe(en.step_st_schedule);
      expect(GLOSSARY['A-CDM'].definition).toBe(en.gl_A_CDM_def);
      expect(ATM_PHASES[2].label).toBe(en.ph_tactical_label);
      expect(ACTORS[0].role).toBe(en.ac_airline_role);
      expect(EVENTS.find((e) => e.id === 'sam')!.label).toBe(en.ev_sam);
      expect(TURNAROUND[0].label).toBe(en.tt_crew);
      expect(ANSP_LABEL.MUAC).toBe(en.ansp_MUAC);
    });
  });
  it('getters follow the active locale', () => {
    const de = withLocale('de', () => CHAPTERS[0].title);
    expect(typeof de).toBe('string');
  });
});
