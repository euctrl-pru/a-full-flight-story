import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    paraglideVitePlugin({ project: './project.inlang', outdir: './src/lib/paraglide', strategy: ['globalVariable', 'baseLocale'] }),
    sveltekit()
  ],
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
