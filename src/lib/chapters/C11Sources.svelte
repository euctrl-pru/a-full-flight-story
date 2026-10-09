<script lang="ts">
  import { SOURCES } from '$lib/story/sources';
  import { GLOSSARY } from '$lib/story/glossary';
  import { ec, sky } from '$lib/data/liveState.svelte';
  import { ageLabel } from '$lib/data/sky';
  const list = Object.values(SOURCES).sort((a, b) => {
    const n = (id: string) => (id.startsWith('S') ? +id.slice(1) : 1000);
    return n(a.id) - n(b.id) || a.id.localeCompare(b.id);
  });
</script>

<section class="sources" id="sources" aria-labelledby="sources-title">
  <h2 id="sources-title">Sources & method</h2>
  <h3>How this was made</h3>
  <ul>
    <li><strong>FFS101 is fictional.</strong> Its callsign, times, route, turnaround and regulation are illustrative, built to follow the real procedures described in the sources below. Every general fact carries a citation.</li>
    <li><strong>Live data.</strong> European traffic, delay, punctuality and CO₂ come from the EUROCONTROL Data app API. Your browser fetches them live; if that fails, the page uses a snapshot refreshed when the site was built (snapshot: {ec.snapshot ? new Date(ec.snapshot.generatedAt).toUTCString() : '—'}).</li>
    <li><strong>The sky snapshot</strong> comes from OpenSky Network state vectors (fallback: adsb.lol), fetched by a scheduled build about every 30 minutes ({sky.snap ? ageLabel(sky.snap.fetchedAt) : 'unavailable'}).</li>
    <li><strong>Simplifications.</strong> The slot simulator is a first-planned-first-served model of CASA. Route charges use along-track distances on the illustrative route; real billing uses the route recorded by the Network Manager. Control-centre assignment is approximated from country and flight level. Prior years' traffic is aligned by day of year; daily values are 7-day averages.</li>
  </ul>
  <h3>Sources</h3>
  <ol class="src">
    {#each list as s (s.id)}
      <li id="src-{s.id}"><span class="id">{s.id.startsWith('S') ? s.id.slice(1) : 'data'}</span> {s.publisher}, <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>. Accessed {s.accessed}.</li>
    {/each}
  </ol>
  <h3>Glossary</h3>
  <dl class="gl">
    {#each Object.values(GLOSSARY).sort((a, b) => a.term.localeCompare(b.term)) as g (g.term)}
      <dt>{g.term}</dt><dd><em>{g.expansion}.</em> {g.definition}</dd>
    {/each}
  </dl>
</section>

<style>
  .sources { max-width: 820px; margin: 0 auto; padding: 20vh 16px 120px; font-size: 16px; }
  .src { list-style: none; padding: 0; }
  .src li { margin: 0 0 6px; overflow-wrap: anywhere; }
  .id { display: inline-block; min-width: 38px; font-weight: 650; color: var(--ink-2); }
  .gl dt { font-weight: 700; margin-top: 8px; }
  .gl dd { margin: 0 0 0 16px; color: var(--ink-2); }
</style>
