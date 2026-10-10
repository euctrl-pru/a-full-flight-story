<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { trafficLines, forecastLines, linesTable } from '$lib/story/derive';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import { HERO } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';

  const ch = chapter('strategic');
  const net = $derived(bundle('network'));
  const lines = $derived(trafficLines(net));
  const fc = $derived(forecastLines(net));
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="swaps">
      {#if step <= 2}
        <Swap>
          <Figure title="Two airport slots, months ahead" sources={['S26', 'S27', 'S7']} illustrative>
            <div class="tickets">
              <div class="ticket"><span class="k">Airport slot · Brussels</span><strong>Departure {HERO.std} UTC</strong><span>Belgium Slot Coordination</span></div>
              <div class="ticket"><span class="k">Airport slot · Rome Fiumicino</span><strong>Arrival {HERO.sta} UTC</strong><span>Assoclearance</span></div>
              {#if step >= 2}<div class="ticket ctot"><span class="k">ATFM slot (CTOT)</span><strong>Not yet</strong><span>Issued on the day by the Network Manager</span></div>{/if}
            </div>
          </Figure>
        </Swap>
      {:else if step === 3}
        <Swap>
          <Figure title="Flights per day in the European network" subtitle="7-day average, by year" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
            table={linesTable(lines, 'Day', doyLabel, fmtInt, 'Daily flights by year')}>
            <LineChart series={lines} label="Daily flights in the European network by year" xFormat={doyLabel} yFormat={fmtInt} reveal={0.25 + progress * 1.5} />
          </Figure>
        </Swap>
      {:else}
        <Swap>
          <Figure title="Flights per year: actual and forecast" subtitle="Million IFR flights, EUROCONTROL forecast scenarios" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
            table={linesTable(fc, 'Year', String, (v) => fmtDec(v, 2), 'Annual flights, actual and forecast (millions)')}>
            <LineChart series={fc} label="Annual flights actual and forecast" xFormat={(x) => String(Math.round(x))} yFormat={(v) => `${fmtDec(v, 1)} M`} />
          </Figure>
        </Swap>
      {/if}
      </div>
    </div>
  {/snippet}
</Chapter>

<style>
  .tickets { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
  .ticket { display: flex; flex-direction: column; gap: 4px; padding: 16px; border: 1px dashed var(--axis); border-radius: 10px; }
  .ticket .k { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-2); }
  .ticket strong { font-size: 22px; }
  .ticket.ctot { border-color: var(--status-warning); }
</style>
