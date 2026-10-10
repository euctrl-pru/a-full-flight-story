import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ pages: process.env.BUILD_DIR ?? 'build', assets: process.env.BUILD_DIR ?? 'build', strict: true }),
    paths: { base: process.env.BASE_PATH ?? '' }
  }
};
