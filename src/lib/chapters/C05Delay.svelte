<script lang="ts">
  import Swap from '$lib/ui/Swap.svelte';
  import { msg } from '$lib/i18n/msg';
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';
  import BarChart from '$lib/viz/BarChart.svelte';
  import StackedArea from '$lib/viz/StackedArea.svelte';
  import SourceLine from '$lib/viz/SourceLine.svelte';
  import { ec, bundle } from '$lib/data/liveState.svelte';
  import { causeBars, causeRows } from '$lib/story/derive';
  import { CAUSES, CAUSE_COLOR, CAUSE_LABEL } from '$lib/viz/palette';
  import { doyLabel, fmtInt, fmtDec } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';
  import { dayPhrase } from '$lib/story/freshness';

  const ch = chapter('delay');
  const net = $derived(bundle('network'));
  const fresh = $derived(ec.freshness.network ?? null);
  const report = $derived(ec.snapshot?.report ?? null);
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step, progress })}
    <div class="stage">
      <div class="swaps">
      {#if step === 0}
        <Swap>
          <Figure title={msg('fig_delay_total_title', { when: dayPhrase(net?.dataDate) })} sources={['D-eurocontrol']} freshness={fresh} dataDate={net?.dataDate}>
            <HeroNumber value={net?.headline.delayMinutes ?? null} label={msg('fig_delay_total_label')}
              sub={net?.headline.delayPerFlight != null ? msg('fig_delay_per_flight', { value: fmtDec(net.headline.delayPerFlight, 2) }) : undefined} />
          </Figure>
        </Swap>
      {:else if step === 1}
        <Swap>
          <Figure title={msg('fig_delay_cause_title', { when: dayPhrase(net?.dataDate) })} subtitle={msg('fig_delay_cause_sub')} sources={['D-eurocontrol']} freshness={fresh} dataDate={net?.dataDate}
            table={{ caption: msg('fig_delay_cause_caption', { when: dayPhrase(net?.dataDate) }), columns: [{ key: 'label', label: msg('ui_col_cause') }, { key: 'value', label: msg('ui_col_minutes'), format: fmtInt }], rows: causeBars(net).map((b) => ({ label: b.label, value: b.value })) }}>
            <BarChart bars={causeBars(net)} label={msg('fig_delay_cause_label')} yFormat={fmtInt} />
          </Figure>
        </Swap>
      {:else if step === 2}
        <Swap>
          <Figure title={msg('fig_delay_year_title')} subtitle={msg('fig_delay_year_sub')} sources={['D-eurocontrol']} freshness={fresh} dataDate={net?.dataDate}
            table={{ caption: msg('fig_delay_year_caption'), columns: [{ key: 'day', label: msg('ui_col_day') }, ...CAUSES.map((c) => ({ key: c, label: CAUSE_LABEL[c], format: fmtInt }))], rows: causeRows(net).map((r) => ({ day: doyLabel(r.x), ...r.values })) }}>
            <StackedArea rows={causeRows(net)} keys={[...CAUSES]} colors={CAUSE_COLOR} labels={CAUSE_LABEL} label={msg('fig_delay_year_label')} xFormat={doyLabel} yFormat={fmtInt} reveal={0.2 + progress * 1.6} />
          </Figure>
        </Swap>
      {:else}
        <Swap>
          <article class="panel report" aria-live="polite">
            {#if report}
              <h3>{report.title}</h3>
              {#each report.blocks.slice(0, 16) as b, i (i)}
                <p class:li={b.kind === 'li'}>{#each b.runs as r, j (j)}{#if r.bold}<strong>{r.text}</strong>{:else}{r.text}{/if}{/each}</p>
              {/each}
              <SourceLine ids={['D-situation']} freshness={ec.reportFreshness} dataDate={report.date} />
            {:else}
              <p>{msg('fig_report_missing')}</p>
              <SourceLine ids={['D-situation']} />
            {/if}
          </article>
        </Swap>
      {/if}
      </div>
    </div>
  {/snippet}
</Chapter>

<style>
  .report { max-height: 100%; overflow: auto; font-size: 15px; }
  .report h3 { margin-top: 0; font-family: var(--font-sans); }
  .report p { margin: 0 0 6px; }
  .report .li { padding-left: 14px; position: relative; }
  .report .li::before { content: '•'; position: absolute; left: 0; color: var(--muted); }
</style>
