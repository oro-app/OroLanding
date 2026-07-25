// Playwright e2e config. The suite always runs against a deployed URL
// (Vercel preview or production) passed via E2E_BASE_URL — there is no
// built-in webServer because vite preview can't serve /api functions or
// the vercel.json rewrites (see e2e/README note in CLAUDE.md).
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL
if (!baseURL) {
  throw new Error('E2E_BASE_URL is required, e.g. E2E_BASE_URL=https://<deployment>.vercel.app npm run e2e')
}

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // NOTE: the Deployment Protection bypass header is injected per-request in
  // e2e/fixtures.js, scoped to same-origin requests only — a global
  // extraHTTPHeaders here would also ride on cross-origin font/CDN requests,
  // whose CORS preflight rejects the unknown header and floods the console.
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
