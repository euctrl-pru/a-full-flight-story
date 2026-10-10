<script lang="ts">
  import { msg } from '$lib/i18n/msg';
  import { theme as shared } from './theme.svelte';
  let theme = $state<'dark' | 'light'>('dark');
  $effect(() => {
    theme = (document.documentElement.dataset.theme as 'dark' | 'light') ?? 'dark';
    shared.current = theme;
  });
  function toggle() {
    theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    shared.current = theme;
    try { localStorage.setItem('theme', theme); } catch {}
  }
</script>

<button type="button" class="tt" onclick={toggle} aria-label={msg(theme === 'dark' ? 'ui_theme_to_light' : 'ui_theme_to_dark')}>{theme === 'dark' ? '☀' : '☾'}</button>

<style>
  .tt { all: unset; cursor: pointer; width: 28px; height: 28px; display: grid; place-items: center; border-radius: 6px; border: 1px solid var(--border); }
  .tt:focus-visible { outline: 2px solid var(--accent); }
</style>
