<script lang="ts">
  import { getLocale } from '$lib/paraglide/runtime.js';
  import { LOCALES, localeHref } from '$lib/i18n/locales';
  import { msg } from '$lib/i18n/msg';
  let open = $state(false);
  let btn: HTMLButtonElement;
  const cur = getLocale();
  function go(e: MouseEvent, code: (typeof LOCALES)[number]['code']) {
    (e.currentTarget as HTMLAnchorElement).href = localeHref(code) + location.hash; // keep the chapter
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && open) { open = false; btn.focus(); }
  }
</script>

<div class="lang" onkeydown={onKey} role="presentation">
  <button type="button" bind:this={btn} aria-haspopup="true" aria-expanded={open} aria-label={msg('ui_language')}
    onclick={() => (open = !open)}>
    {cur.toUpperCase()} ▾
  </button>
  {#if open}
    <ul>
      {#each LOCALES as l (l.code)}
        <li><a href={localeHref(l.code)} hreflang={l.code} lang={l.code} data-sveltekit-reload aria-current={l.code === cur ? 'true' : undefined} onclick={(e) => go(e, l.code)}>{l.name}</a></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .lang { position: relative; flex-shrink: 0; }
  button { all: unset; cursor: pointer; font-size: 12px; font-weight: 600; padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); white-space: nowrap; }
  button:focus-visible { outline: 2px solid var(--accent); }
  ul { position: absolute; right: 0; top: calc(100% + 6px); list-style: none; margin: 0; padding: 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; z-index: 60; min-width: 140px; }
  a { display: block; padding: 6px 10px; border-radius: 6px; color: var(--ink); text-decoration: none; font-size: 14px; }
  a:hover, a:focus-visible { background: var(--surface-2); }
  a[aria-current] { font-weight: 700; }
  @media (max-width: 700px) { button { padding: 4px 6px; } }
</style>
