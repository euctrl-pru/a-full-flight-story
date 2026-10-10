<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { dur } from '$lib/scroll/motion';
  let { children }: { children: Snippet } = $props();
</script>

<div class="swap" in:fly={{ y: 24, duration: dur(450), easing: cubicOut }} out:fade={{ duration: dur(250) }}>
  {@render children()}
</div>
