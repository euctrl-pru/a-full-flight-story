<script lang="ts">
  import { onMount } from 'svelte';
  import { getLocale, type Locale } from '$lib/paraglide/runtime.js';
  import { preferredSupported } from '$lib/i18n/hint';
  import { localeHref } from '$lib/i18n/locales';
  import { msg, withLocale } from '$lib/i18n/msg';
  let target: Locale | null = $state(null);
  onMount(() => {
    if (getLocale() !== 'en') return;
    try { if (localStorage.getItem('lang-hint-dismissed') === '1') return; } catch {}
    target = preferredSupported(navigator.languages ?? [navigator.language]);
  });
  // Shows the *target* language's text. withLocale resets the override to English, the only locale this renders on.
  const text = $derived(target ? withLocale(target, () => ({ q: msg('hint_question'), yes: msg('hint_yes'), no: msg('hint_no') })) : null);
  function dismiss() { target = null; try { localStorage.setItem('lang-hint-dismissed', '1'); } catch {} }
</script>

{#if target && text}
  <div class="hint" data-testid="language-hint" lang={target} role="region" aria-label={text.q}>
    <span>{text.q}</span>
    <a href={localeHref(target)} data-sveltekit-reload onclick={(e) => ((e.currentTarget as HTMLAnchorElement).href = localeHref(target!) + location.hash)}>{text.yes}</a>
    <button type="button" onclick={dismiss}>{text.no}</button>
  </div>
{/if}

<style>
  .hint { position: fixed; top: var(--clock-h); left: 50%; transform: translateX(-50%); z-index: 49; display: flex; gap: 12px; align-items: center; padding: 8px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 0 0 10px 10px; font-size: 14px; max-width: calc(100vw - 16px); }
  a { color: var(--accent); font-weight: 600; }
  button { all: unset; cursor: pointer; color: var(--ink-2); text-decoration: underline; }
  button:focus-visible { outline: 2px solid var(--accent); }
</style>
