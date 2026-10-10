import { defineConfig, devices } from '@playwright/test';

// Base-path regression guard (production is served under /a-full-flight-story/).
// A separate config with its own webServer keeps the default suite untouched and avoids two
// `vite build`s running at once: this one only runs via `npm run test:e2e:base`, never in parallel
// with `npm run test:e2e`. BUILD_DIR keeps the adapter output out of the default `build/` dir
// (vite preview itself serves from .svelte-kit, which is rebuilt by whichever suite runs next).
export const BASE = '/a-full-flight-story';

export default defineConfig({
  testDir: 'tests/e2e-base',
  timeout: 60_000,
  webServer: {
    command: `BASE_PATH=${BASE} BUILD_DIR=build-base npm run build && BASE_PATH=${BASE} npm run preview -- --port 4174 --strictPort`,
    url: `http://localhost:4174${BASE}/`,
    reuseExistingServer: false,
    timeout: 240_000
  },
  use: { baseURL: 'http://localhost:4174' },
  projects: [{ name: 'base-path', use: { ...devices['Desktop Chrome'] } }]
});
