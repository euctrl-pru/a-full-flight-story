<script lang="ts">
  import { onMount } from 'svelte';
  import { ec, startLoading, bundle } from '$lib/data/liveState.svelte';
  import { dayOfYear, yearOfSeries, stackByName } from '$lib/data/series';
  import { CAUSES, CAUSE_COLOR, CAUSE_LABEL, yearStyle } from '$lib/viz/palette';
  import { doyLabel, fmtInt } from '$lib/viz/chart-utils';
  import { hourlyCounts } from '$lib/sim/demand';
  import { scenario, REGULATION } from '$lib/story/scenario';
  import { fmtHm } from '$lib/viz/chart-utils';
  import Figure from '$lib/viz/Figure.svelte';
  import LineChart from '$lib/viz/LineChart.svelte';
  import StackedArea from '$lib/viz/StackedArea.svelte';
  import BarChart from '$lib/viz/BarChart.svelte';
  import HeroNumber from '$lib/viz/HeroNumber.svelte';

  onMount(startLoading);
  const net = $derived(bundle('network'));
  const traffic = $derived(
    (net?.traffic ?? []).filter((s) => s.chartType === 'daily_evolution').map((s) => {
      const yr = yearOfSeries(s) ?? 0;
      return { id: s.name, label: s.name, ...yearStyle(yr, 2026), points: s.points.map((p) => ({ x: dayOfYear(p.date), y: p.value })) };
    })
  );
  const causes = $derived(
    stackByName((net?.delay ?? []).filter((s) => s.chartType === 'category_evolution' && s.dateRange === 'Y2D'), [...CAUSES])
      .map((r) => ({ x: dayOfYear(r.date), values: r.values }))
  );
  const demand = hourlyCounts(scenario().flights, 240, 600).map((b) => ({ key: String(b.start), label: fmtHm(b.start), value: b.count }));
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<main class="gallery">
  <Figure title="Flights per day" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}>
    <HeroNumber value={net?.headline.flights ?? null} label="flights yesterday" />
  </Figure>
  <Figure title="European network traffic, 7-day average" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}
    table={{ caption: 'Daily flights 2026', columns: [{ key: 'day', label: 'Day' }, { key: 'v', label: '2026', format: fmtInt }], rows: (traffic.find((t) => t.id === '2026')?.points ?? []).map((p) => ({ day: doyLabel(p.x), v: p.y })) }}>
    <LineChart series={traffic} label="Daily flights by year" xFormat={doyLabel} yFormat={fmtInt} />
  </Figure>
  <Figure title="ATFM delay by cause, year to date" sources={['D-eurocontrol']} freshness={ec.freshness.network ?? null} dataDate={net?.dataDate}>
    <StackedArea rows={causes} keys={[...CAUSES]} colors={CAUSE_COLOR} labels={CAUSE_LABEL} label="Delay minutes by cause" xFormat={doyLabel} yFormat={fmtInt} />
  </Figure>
  <Figure title="Demand vs capacity" sources={['S7']} illustrative>
    <BarChart bars={demand} label="Flights per hour" refLine={{ value: REGULATION.rate, label: `Capacity ${REGULATION.rate}/h` }} />
  </Figure>
</main>

<style>
  .gallery { display: grid; gap: 24px; padding: 24px 16px; max-width: 1100px; margin: 0 auto; }
</style>
