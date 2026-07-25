// Playwright e2e config. The suite always runs against a deployed URL
// (Vercel preview or production) passed via E2E_BASE_URL — there is no
// built-in webServer because vite preview can't serve /api functions or
// the vercel.json rewrites (see e2e/README note in CLAUDE.md).
import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL
if (!baseURL) {
  throw new Error('E2E_BASE_URL is required, e.g. E2E_BASE_URL=https://<deployment>.vercel.app npm run e2e')
}

// Vercel Deployment Protection bypass (only sent when configured).
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const extraHTTPHeaders = bypassSecret
  ? { 'x-vercel-protection-bypass': bypassSecret }
  : undefined

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    extraHTTPHeaders,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
