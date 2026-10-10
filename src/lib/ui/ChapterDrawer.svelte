<script lang="ts">
  import { CHAPTERS } from '$lib/story/chapters';
  import { ATM_PHASES } from '$lib/story/phases';
  import { story } from '$lib/scroll/storyState.svelte';
  import { UI } from './ui-strings';

  let dlg: HTMLDialogElement;
  let btn: HTMLButtonElement;
  const numbered = CHAPTERS.filter((c) => c.kicker.startsWith('Chapter'));
  const current = $derived(numbered.findIndex((c) => c.id === story.chapterId) + 1);
  function close() { dlg.close(); btn.focus(); }
</script>

<button type="button" class="open" bind:this={btn} onclick={() => dlg.showModal()} aria-haspopup="dialog">☰ {UI.chapters}</button>
<dialog bind:this={dlg} aria-labelledby="drawer-title" onclose={() => btn?.focus()}>
  <div class="head">
    <h2 id="drawer-title">{UI.chapters}</h2>
    {#if current > 0}<span class="n">{UI.chapterOf(current, numbered.length)}</span>{/if}
    <button type="button" class="x" onclick={close} aria-label={UI.close}>✕</button>
  </div>
  <nav>
    <a href="#cold-open" onclick={close}>{UI.prologue} · The sky over Europe</a>
    {#each ATM_PHASES as p (p.id)}
      <h3 style:--c={p.color}>{p.label}</h3>
      <ul>
        {#each CHAPTERS.filter((c) => c.phase === p.id) as c (c.id)}
          <li><a href="#{c.id}" onclick={close} aria-current={story.chapterId === c.id ? 'location' : undefined}>{c.title}</a></li>
        {/each}
      </ul>
    {/each}
    <a href="#sources" onclick={close}>{UI.sourcesAndMethod}</a>
  </nav>
</dialog>

<style>
  .open { all: unset; cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); white-space: nowrap; }
  .open:focus-visible, .x:focus-visible { outline: 2px solid var(--accent); }
  dialog { margin: 0 0 0 auto; height: 100svh; max-height: 100svh; width: min(380px, 100vw); border: 0; border-left: 1px solid var(--border); background: var(--surface); color: var(--ink); padding: 16px 20px; }
  dialog::backdrop { background: rgb(0 0 0 / 0.45); }
  .head { display: flex; align-items: baseline; gap: 10px; }
  .head h2 { font-size: 24px; margin: 0; }
  .n { font-size: 13px; color: var(--ink-2); }
  .x { all: unset; cursor: pointer; margin-left: auto; font-size: 18px; padding: 4px 8px; }
  h3 { font-family: var(--font-sans); font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin: 18px 0 6px; padding-left: 8px; border-left: 4px solid var(--c); }
  ul { list-style: none; margin: 0; padding: 0; }
  a { display: block; padding: 6px 8px; border-radius: 6px; color: var(--ink); text-decoration: none; }
  a:hover, a:focus-visible { background: var(--surface-2); }
  a[aria-current] { font-weight: 700; }
  nav > a { margin-top: 12px; }
</style>
