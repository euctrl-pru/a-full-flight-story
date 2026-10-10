<script lang="ts">
  import { msg } from '$lib/i18n/msg';
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
      <Figure title={msg('fig_twist_title')} subtitle={msg('fig_twist_sub', { id: REGULATION.id, start: fmtHm(REGULATION.start), end: fmtHm(REGULATION.end) })} sources={['S7']} illustrative>
        <CasaQueue stage={STAGES[step] ?? 'explore'} />
      </Figure>
    </div>
  {/snippet}
</Chapter>
