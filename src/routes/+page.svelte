<script lang="ts">
  import { onMount } from 'svelte';
  import { startLoading } from '$lib/data/liveState.svelte';
  import MissionClock from '$lib/ui/MissionClock.svelte';
  import OverviewTimeline from '$lib/viz/OverviewTimeline.svelte';
  import { UI } from '$lib/ui/ui-strings';
  import C00ColdOpen from '$lib/chapters/C00ColdOpen.svelte';
  import C01Strategic from '$lib/chapters/C01Strategic.svelte';
  import C02Airspace from '$lib/chapters/C02Airspace.svelte';
  import C03Filing from '$lib/chapters/C03Filing.svelte';
  import C04Twist from '$lib/chapters/C04Twist.svelte';
  import C05Delay from '$lib/chapters/C05Delay.svelte';
  import C06Reroute from '$lib/chapters/C06Reroute.svelte';
  import C07Ground from '$lib/chapters/C07Ground.svelte';
  import C08Enroute from '$lib/chapters/C08Enroute.svelte';
  import C09Arrival from '$lib/chapters/C09Arrival.svelte';
  import C10PostOps from '$lib/chapters/C10PostOps.svelte';
  import C11Sources from '$lib/chapters/C11Sources.svelte';
  onMount(startLoading);
</script>

<svelte:head>
  <title>A Full Flight Story — how a flight becomes a flight in Europe</title>
  <meta name="description" content="Follow FFS101 from Brussels to Rome — from airport slots ten months ahead to the flight plan, an ATFM slot, a reroute and post-ops — with live EUROCONTROL data." />
</svelte:head>

<MissionClock />
<main>
  <header class="intro">
    <p class="kicker">A data story · with live EUROCONTROL data</p>
    <h1>A Full Flight Story</h1>
    <p class="dek">How a flight becomes a flight in Europe: following FFS101 from Brussels to Rome, from ten months before take-off to long after landing.</p>
    <p class="note">FFS101 is fictional; the procedures, the stakeholders and every number are real and sourced. Times are UTC. <a href="#sources">Sources & method</a></p>
    <p class="hint" aria-hidden="true">Scroll ↓</p>
  </header>
  <section class="overview" id="overview" aria-labelledby="overview-title">
    <h2 id="overview-title">{UI.overviewTitle}</h2>
    <OverviewTimeline />
  </section>
  <C00ColdOpen /><C01Strategic /><C02Airspace /><C03Filing /><C04Twist /><C05Delay />
  <C06Reroute /><C07Ground /><C08Enroute /><C09Arrival /><C10PostOps /><C11Sources />
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
