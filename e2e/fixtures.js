// Shared fixtures for the e2e suite.
//
// By default every test pre-seeds storage so the two attention-grabbing
// overlays stay out of the way:
//   - oro_cookie_consent = 'declined'  → no cookie banner, no GA requests
//   - oro_newsletter_signup_seen_session = 'true' → no auto-open waitlist modal
// Tests that exercise those overlays opt out via `test.use({ seedStorage: false })`.
import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  seedStorage: [true, { option: true }],

  context: async ({ context, seedStorage }, use) => {
    if (seedStorage) {
      await context.addInitScript(() => {
        window.localStorage.setItem('oro_cookie_consent', 'declined')
        window.sessionStorage.setItem('oro_newsletter_signup_seen_session', 'true')
      })
    }
    await use(context)
  },

  // mockWaitlist(status) intercepts POST /api/waitlist so tests never write
  // to the real Supabase waitlist table. Returns a promise-producing getter
  // for the intercepted request body.
  mockWaitlist: async ({ page }, use) => {
    let lastBody = null
    await use(async (status) => {
      await page.route('**/api/waitlist', async (route) => {
        lastBody = route.request().postDataJSON()
        const bodies = {
          201: { success: true },
          409: { code: 'already_registered' },
          500: { error: 'db_error' },
        }
        await route.fulfill({ status, json: bodies[status] ?? {} })
      })
      return () => lastBody
    })
  },
})

// Rewrites, redirects, and /api functions only exist on real Vercel
// deployments — skip those tests when pointed at a local vite preview.
export const deploymentOnly = () => {
  test.skip(
    /localhost|127\.0\.0\.1/.test(process.env.E2E_BASE_URL ?? ''),
    'Requires a real Vercel deployment (rewrites + /api functions)'
  )
}

export { expect }
