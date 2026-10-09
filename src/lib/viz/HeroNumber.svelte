<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { dur } from '$lib/scroll/motion';
  import { fmtInt } from './chart-utils';
  let { value, label, sub, format = fmtInt }: { value: number | null; label: string; sub?: string; format?: (n: number) => string } = $props();
  const t = new Tween(0, { duration: dur(1200), easing: cubicOut });
  $effect(() => { if (value !== null) t.target = value; });
</script>

<div class="hero">
  <div class="v" aria-live="polite">{value === null ? '—' : format(t.current)}</div>
  <div class="l">{label}</div>
  {#if sub}<div class="s">{sub}</div>{/if}
</div>

<style>
  .v { font-size: clamp(44px, 8vw, 96px); font-weight: 700; line-height: 1; letter-spacing: -0.02em; }
  .l { font-size: 16px; color: var(--ink-2); margin-top: 6px; }
  .s { font-size: 13px; color: var(--muted); margin-top: 2px; }
</style>
