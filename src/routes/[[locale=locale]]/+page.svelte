<script lang="ts">
  import { onMount } from 'svelte';
  import { msg } from '$lib/i18n/msg';
  import { startLoading } from '$lib/data/liveState.svelte';
  import MissionClock from '$lib/ui/MissionClock.svelte';
  import OverviewTimeline from '$lib/viz/OverviewTimeline.svelte';
  import { SITE_URL } from '$lib/site';
  import { LOCALES } from '$lib/i18n/locales';
  import LanguageHint from '$lib/ui/LanguageHint.svelte';
  import C00ColdOpen from '$lib/chapters/C00ColdOpen.svelte';
  import C01Strategic from '$lib/chapters/C01Strategic.svelte';
  import C02Airspace from '$lib/chapters/C02Airspace.svelte';
  import C02bWeekBefore from '$lib/chapters/C02bWeekBefore.svelte';
  import PhaseDivider from '$lib/ui/PhaseDivider.svelte';
  import C03Filing from '$lib/chapters/C03Filing.svelte';
  import C04Twist from '$lib/chapters/C04Twist.svelte';
  import C05Delay from '$lib/chapters/C05Delay.svelte';
  import C06Reroute from '$lib/chapters/C06Reroute.svelte';
  import C07Ground from '$lib/chapters/C07Ground.svelte';
  import C08Enroute from '$lib/chapters/C08Enroute.svelte';
  import C09Arrival from '$lib/chapters/C09Arrival.svelte';
  import C10PostOps from '$lib/chapters/C10PostOps.svelte';
  import C11Sources from '$lib/chapters/C11Sources.svelte';
  let { data } = $props();
  const url = (l: string) => (l === 'en' ? SITE_URL : `${SITE_URL}${l}/`);
  const OG: Record<string, string> = { en: 'en_GB', de: 'de_DE', fr: 'fr_FR', it: 'it_IT', es: 'es_ES', pl: 'pl_PL' };
  const title = $derived(msg('seo_title'));
  const description = $derived(msg('seo_description'));
  onMount(startLoading);
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url(data.locale)} />
  {#each LOCALES as l (l.code)}<link rel="alternate" hreflang={l.code} href={url(l.code)} />{/each}
  <link rel="alternate" hreflang="x-default" href={SITE_URL} />
  <meta property="og:type" content="article" />
  <meta property="og:locale" content={OG[data.locale]} />
  {#each LOCALES.filter((l) => l.code !== data.locale) as l (l.code)}<meta property="og:locale:alternate" content={OG[l.code]} />{/each}
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url(data.locale)} />
  <meta property="og:image" content="{SITE_URL}og.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content="{SITE_URL}og.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Article', headline: title, description,
    url: url(data.locale), inLanguage: data.locale, image: `${SITE_URL}og.png`, datePublished: '2026-10-10', author: { '@type': 'Organization', name: 'EUROCONTROL Performance Review Unit (euctrl-pru)' }
  }).replace(/</g, '\\u003c')}</script>`}
</svelte:head>

<LanguageHint />
<MissionClock />
<main>
  <header class="intro" id="top">
    <p class="kicker">{msg('intro_kicker')}</p>
    <h1>{msg('site_title')}</h1>
    <p class="dek">{msg('intro_dek')}</p>
    <p class="note">{msg('intro_note')} <a href="#sources">{msg('ui_sources_and_method')}</a></p>
    <p class="hint" aria-hidden="true">{msg('intro_scroll')}</p>
  </header>
  <section class="overview" id="overview" aria-labelledby="overview-title">
    <h2 id="overview-title">{msg('ui_overview_title')}</h2>
    <OverviewTimeline />
  </section>
  <C00ColdOpen />
  <PhaseDivider phase="strategic" />
  <C01Strategic /><C02Airspace />
  <PhaseDivider phase="pretactical" />
  <C02bWeekBefore /><C03Filing />
  <PhaseDivider phase="tactical" />
  <C04Twist /><C05Delay /><C06Reroute /><C07Ground /><C08Enroute /><C09Arrival />
  <PhaseDivider phase="postops" />
  <C10PostOps /><C11Sources />
</main>

<style>
  .overview { max-width: 1100px; margin: 0 auto; padding: 8vh 16px 12vh; }
  .overview h2 { font-size: clamp(26px, 3.5vw, 40px); }
  .intro { min-height: 100svh; display: flex; flex-direction: column; justify-content: center; max-width: 820px; margin: 0 auto; padding: calc(var(--clock-h) + 24px) 16px 24px; }
  .kicker { text-transform: uppercase; letter-spacing: 0.12em; font-size: 13px; color: var(--ink-2); }
  h1 { font-size: clamp(48px, 9vw, 112px); margin: 0.1em 0; }
  .dek { font-size: clamp(20px, 2.4vw, 26px); color: var(--ink-2); max-width: 36ch; }
  .note { font-size: 15px; color: var(--muted); }
  .hint { margin-top: 10vh; color: var(--muted); }
</style>
