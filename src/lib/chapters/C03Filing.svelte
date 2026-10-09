<script lang="ts">
  import Chapter from '$lib/ui/Chapter.svelte';
  import Figure from '$lib/viz/Figure.svelte';
  import FplAnatomy from '$lib/viz/FplAnatomy.svelte';
  import { chapter } from '$lib/story/chapters';
  const ch = chapter('filing');
  const ACTIVE = [['all'], ['7', '8', '9', '10'], ['13'], ['15'], ['18'], [], []];
  const STAGE = ['message', 'message', 'message', 'message', 'message', 'validate', 'distribute'] as const;
</script>

<Chapter chapter={ch}>
  {#snippet graphic({ step })}
    <div class="stage">
      <Figure title="FFS101's ICAO flight plan" subtitle="ICAO 2012 format, as sent to IFPS" sources={['S9', 'S10']} illustrative>
        <FplAnatomy active={ACTIVE[step] ?? []} stage={STAGE[step] ?? 'message'} />
      </Figure>
    </div>
  {/snippet}
</Chapter>
