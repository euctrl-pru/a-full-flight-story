<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import { getLocale } from '$lib/paraglide/runtime.js';
  import { fmtDateTime } from '$lib/viz/chart-utils';
  import { SOURCES } from '$lib/story/sources';
  import { GLOSSARY } from '$lib/story/glossary';
  import { ec, sky } from '$lib/data/liveState.svelte';
  import { ageLabel } from '$lib/story/freshness';
  const list = Object.values(SOURCES).sort((a, b) => {
    const n = (id: string) => (id.startsWith('S') ? +id.slice(1) : 1000);
    return n(a.id) - n(b.id) || a.id.localeCompare(b.id);
  });
</script>

<section class="sources" id="sources" aria-labelledby="sources-title">
  <h2 id="sources-title">{msg('ui_sources_and_method')}</h2>
  <h3>{msg('method_title_how')}</h3>
  <ul>
    <li><strong>{msg('method_fictional_lead')}</strong> {msg('method_fictional')}</li>
    <li><strong>{msg('method_live_lead')}</strong> {msg('method_live', { date: ec.snapshot ? `${fmtDateTime(ec.snapshot.generatedAt)} ${msg('ui_utc')}` : '—' })}</li>
    <li><strong>{msg('method_sky_lead')}</strong> {msg('method_sky', { age: sky.snap ? ageLabel(sky.snap.fetchedAt) : msg('method_sky_unavailable') })}</li>
    <li><strong>{msg('method_simpl_lead')}</strong> {msg('method_simpl')}</li>
    {#if getLocale() !== 'en'}<li>{msg('method_ai_note')}</li>{/if}
  </ul>
  <h3>{msg('method_title_sources')}</h3>
  <ol class="src">
    {#each list as s (s.id)}
      <li id="src-{s.id}"><span class="id">{s.id.startsWith('S') ? s.id.slice(1) : msg('ui_cite_data')}</span> {s.publisher}, <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>. {msg('method_accessed', { date: s.accessed })}</li>
    {/each}
  </ol>
  <h3>{msg('method_title_glossary')}</h3>
  <dl class="gl">
    {#each Object.values(GLOSSARY).sort((a, b) => a.term.localeCompare(b.term)) as g (g.term)}
      <dt>{g.term}</dt><dd><em>{g.expansion}.</em> {g.definition}</dd>
    {/each}
  </dl>
  <p class="totop"><a href="#top">{msg('ui_back_to_top')}</a></p>
</section>

<style>
  .totop { margin-top: 48px; }
  .sources { max-width: 820px; margin: 0 auto; padding: 20vh 16px 120px; font-size: 16px; }
  .src { list-style: none; padding: 0; }
  .src li { margin: 0 0 6px; overflow-wrap: anywhere; }
  .id { display: inline-block; min-width: 38px; font-weight: 650; color: var(--ink-2); }
  .gl dt { font-weight: 700; margin-top: 8px; }
  .gl dd { margin: 0 0 0 16px; color: var(--ink-2); }
</style>
