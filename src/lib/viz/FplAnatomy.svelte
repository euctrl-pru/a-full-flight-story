<script lang="ts">
  import { HERO_FPL } from '$lib/story/fpl';
  import { ANSP_LABEL } from '$lib/story/flight';
  let { active, stage }: { active: string[]; stage: 'message' | 'validate' | 'distribute' } = $props();

  const chunks = (() => {
    const out: { text: string; item: string | null; label?: string }[] = [];
    let i = 0;
    for (const s of HERO_FPL.spans) {
      if (s.start > i) out.push({ text: HERO_FPL.text.slice(i, s.start), item: null });
      out.push({ text: HERO_FPL.text.slice(s.start, s.end), item: s.item, label: s.label });
      i = s.end;
    }
    out.push({ text: HERO_FPL.text.slice(i), item: null });
    return out;
  })();
  const CHECKS = ['Syntax & format', 'Aerodromes & aircraft type', 'Route vs RAD restrictions', 'Airspace availability (AUP)', '4D profile calculated'];
  const UNITS = ['Brussels TWR/APP', ...['MUAC', 'DSNA', 'Skyguide', 'ENAV'].map((k) => ANSP_LABEL[k as keyof typeof ANSP_LABEL]), 'ETFMS (flow)', 'Airline (ACK)'];
</script>

<div class="fpl">
  <pre aria-label="ICAO flight plan for FFS101">{#each chunks as c}{#if c.item}<mark class:on={active.includes(c.item) || active.includes('all')} title="Item {c.item}: {c.label}">{c.text}</mark>{:else}{c.text}{/if}{/each}</pre>
  {#each HERO_FPL.spans.filter((x) => active.includes(x.item)) as s (s.item)}
    <p class="item"><strong>Item {s.item}</strong> — {s.label}</p>
  {/each}
  {#if stage !== 'message'}
    <ol class="checks">
      {#each CHECKS as c, i}<li style:animation-delay="{i * 180}ms">✓ {c}</li>{/each}
      <li class="ack" style:animation-delay="{CHECKS.length * 180}ms">ACK — accepted automatically</li>
    </ol>
  {/if}
  {#if stage === 'distribute'}
    <svg class="fan" viewBox="0 0 430 220" role="img" aria-label="IFPS distributes the flight plan to every unit on the route">
      <circle cx="40" cy="110" r="22" class="hub" /><text x="40" y="114" text-anchor="middle" class="hubt">IFPS</text>
      {#each UNITS as u, i}
        {@const y = 20 + i * (180 / (UNITS.length - 1))}
        <path d="M62,110 C180,110 180,{y} 250,{y}" class="edge" style:animation-delay="{i * 120}ms" />
        <circle cx="254" cy={y} r="4" class="node" /><text x="264" y={y + 4} class="nt">{u}</text>
      {/each}
    </svg>
  {/if}
</div>

<style>
  .fpl { display: flex; flex-direction: column; gap: 12px; height: 100%; justify-content: center; padding: 16px; }
  pre { font-size: clamp(12px, 1.5vw, 16px); line-height: 1.7; white-space: pre-wrap; word-break: break-all; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin: 0; }
  mark { background: transparent; color: var(--ink-2); border-radius: 3px; transition: background 250ms, color 250ms; }
  mark.on { background: color-mix(in srgb, var(--accent) 35%, transparent); color: var(--ink); }
  .item { margin: 0; font-size: 15px; }
  .checks { list-style: none; padding: 0; margin: 0; font-size: 14px; }
  .checks li { opacity: 0; animation: in 300ms forwards; color: var(--ink-2); }
  .checks .ack { color: var(--status-good); font-weight: 700; }
  @keyframes in { to { opacity: 1; } }
  .fan { width: 100%; max-height: 260px; }
  .hub { fill: var(--accent); } .hubt { fill: #fff; font-size: 11px; font-weight: 700; }
  .edge { fill: none; stroke: var(--accent); stroke-width: 1.5; stroke-dasharray: 300; stroke-dashoffset: 300; animation: draw 700ms forwards; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  .node { fill: var(--ink); } .nt { fill: var(--ink-2); font-size: 11px; }
</style>
