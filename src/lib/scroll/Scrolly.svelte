<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import type { Scroller } from 'scrollama';

  let { children, onstep, onprogress, offset = 0.6 }: {
    children: Snippet;
    onstep?: (index: number, direction: 'up' | 'down') => void;
    onprogress?: (index: number, progress: number) => void;
    offset?: number;
  } = $props();

  let root: HTMLDivElement;

  onMount(() => {
    let scroller: Scroller | undefined;
    let alive = true;
    const ro = new ResizeObserver(() => scroller?.resize());
    import('scrollama').then(({ default: scrollama }) => {
      if (!alive) return;
      scroller = scrollama()
        .setup({ step: Array.from(root.querySelectorAll(':scope > [data-step]')), offset, progress: !!onprogress })
        .onStepEnter((e) => onstep?.(e.index, e.direction));
      if (onprogress) scroller.onStepProgress((e) => onprogress(e.index, e.progress));
      ro.observe(document.documentElement);
    });
    return () => {
      alive = false;
      ro.disconnect();
      scroller?.destroy();
    };
  });
</script>

<div class="steps" bind:this={root}>{@render children()}</div>
