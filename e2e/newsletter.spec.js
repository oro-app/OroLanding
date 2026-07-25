import { test, expect } from './fixtures'

// Past-dated issue (2026-05-26) — stable, never release-gated again.
const RELEASED_SLUG = 'the-rule-of-three'

test(`released issue /newsletter/${RELEASED_SLUG} renders`, async ({ page }) => {
  await page.goto(`/newsletter/${RELEASED_SLUG}`)
  await expect(page.locator('.newsletter-not-found')).toHaveCount(0)
  // MDX body rendered with real prose.
  await expect(page.locator('#root')).toContainText(/rule of three/i)
})

test('nonexistent slug shows the not-found view', async ({ page }) => {
  await page.goto('/newsletter/this-slug-does-not-exist')
  await expect(page.locator('.newsletter-not-found')).toContainText(
    /could not find that note/i
  )
})

test.describe('auto-open waitlist modal', () => {
  // Opt out of storage seeding so the once-per-session auto-open fires.
  test.use({ seedStorage: false })

  test('opens once per session on a newsletter page', async ({ page }) => {
    await page.goto(`/newsletter/${RELEASED_SLUG}`)
    await expect(page.locator('.modal-backdrop')).toBeVisible({ timeout: 15000 })
    await page.locator('.modal-close-x').click()
    await expect(page.locator('.modal-backdrop')).toHaveCount(0)

    // Same session: navigating again must NOT reopen it.
    await page.goto(`/newsletter/${RELEASED_SLUG}`)
    await page.waitForTimeout(3000)
    await expect(page.locator('.modal-backdrop')).toHaveCount(0)
  })
})
