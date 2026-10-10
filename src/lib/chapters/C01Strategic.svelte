<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import { msg } from '$lib/i18n/msg';
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { trafficLines, forecastLines, linesTable } from '$lib/story/derive';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import { HERO } from '$lib/story/flight';
  import { chapter } from '$lib/story/chapters';
  import { currentYear } from '$lib/story/freshness';

  const ch = chapter('strategic');
  const net = $derived(bundle('network'));
  const cy = $derived(currentYear(net?.dataDate));
  const lines = $derived(trafficLines(net, [2019, cy - 1, cy], cy));
  const fc = $derived(forecastLines(net));
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="swaps">
      {#if step <= 2}
        <Swap>
          <Figure title={msg('fig_slots_title')} sources={['S26', 'S27', 'S7']} illustrative>
            <div class="tickets">
              <div class="ticket"><span class="k">{msg('fig_slot_bru')}</span><strong>{msg('fig_slot_departure', { time: HERO.std })}</strong><span>Belgium Slot Coordination</span></div>
              <div class="ticket"><span class="k">{msg('fig_slot_fco')}</span><strong>{msg('fig_slot_arrival', { time: HERO.sta })}</strong><span>Assoclearance</span></div>
              {#if step >= 2}<div class="ticket ctot"><span class="k">{msg('fig_slot_ctot')}</span><strong>{msg('fig_slot_not_yet')}</strong><span>{msg('fig_slot_ctot_note')}</span></div>{/if}
            </div>
          </Figure>
        </Swap>
      {:else if step === 3}
        <Swap>
          <Figure title={msg('fig_flights_day_title')} subtitle={msg('fig_flights_day_sub')} sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
            table={linesTable(lines, msg('ui_col_day'), doyLabel, fmtInt, msg('fig_flights_day_caption'))}>
            <LineChart series={lines} label={msg('fig_flights_day_label')} xFormat={doyLabel} yFormat={fmtInt} reveal={0.25 + progress * 1.5} />
          </Figure>
        </Swap>
      {:else}
        <Swap>
          <Figure title={msg('fig_forecast_title')} subtitle={msg('fig_forecast_sub')} sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
            table={linesTable(fc, msg('ui_col_year'), String, (v) => fmtDec(v, 2), msg('fig_forecast_caption'))}>
            <LineChart series={fc} label={msg('fig_forecast_label')} xFormat={(x) => String(Math.round(x))} yFormat={(v) => msg('fig_million_unit', { value: fmtDec(v, 1) })} />
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
