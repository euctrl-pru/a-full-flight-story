<script lang="ts">
  import { msg } from '$lib/i18n/msg';
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
      <Figure title={msg('fig_fpl_title')} subtitle={msg('fig_fpl_sub')} sources={['S9', 'S10']} illustrative>
        <FplAnatomy active={ACTIVE[step] ?? []} stage={STAGE[step] ?? 'message'} />
      </Figure>
    </div>
  {/snippet}
</Chapter>
