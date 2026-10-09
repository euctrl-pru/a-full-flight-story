<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import CasaQueue from '$lib/viz/CasaQueue.svelte';
  import { REGULATION } from '$lib/story/scenario';
  import { fmtHm } from '$lib/viz/chart-utils';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('twist');
  const STAGES = ['demand', 'regulation', 'queue', 'hero', 'explore'] as const;
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <Figure title="Demand vs capacity in a Reims sector group" subtitle="Regulation {REGULATION.id}: {fmtHm(REGULATION.start)}–{fmtHm(REGULATION.end)} UTC, simulated traffic" sources={['S7']} illustrative>
        <CasaQueue stage={STAGES[step] ?? 'explore'} />
      </Figure>
    </div>
  {/snippet}
</Chapter>
