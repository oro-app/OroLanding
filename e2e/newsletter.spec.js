import { test, expect } from './fixtures'

// Past-dated issue (2026-05-26) — stable, never release-gated again.
const RELEASED_SLUG = 'the-rule-of-three'

test(`released issue /newsletter/${RELEASED_SLUG} renders`, async ({ page }) => {
  await page.goto(`/newsletter/${RELEASED_SLUG}`, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.newsletter-not-found')).toHaveCount(0)
  // MDX body rendered with real prose.
  await expect(page.locator('#root')).toContainText(/rule of three/i)
})

test('nonexistent slug shows the not-found view', async ({ page }) => {
  await page.goto('/newsletter/this-slug-does-not-exist', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.newsletter-not-found')).toContainText(
    /could not find that note/i
  )
  await expect(page.locator('.halo-header')).toBeVisible()
  await expect(page.locator('footer')).toHaveCount(1)
})

for (const width of [320, 390, 1440]) {
  test(`article uses the current design and fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() => localStorage.setItem('oro_theme', 'dark'))
    await page.goto(`/newsletter/${RELEASED_SLUG}`)
    await page.evaluate(() => document.fonts.ready)
    await expect(page.locator('.halo-header')).toBeVisible()
    await expect(page.locator('main')).toHaveCount(1)
    await expect(page.locator('footer')).toHaveCount(1)
    await expect(page.locator('.oro-theme')).toHaveCSS('background-color', 'rgb(252, 251, 255)')
    await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', 'Fraunces, Georgia, serif')
    await expect(page.locator('.newsletter-mdx > p').first()).toHaveCSS('font-family', '"DM Sans", sans-serif')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    await page.locator('.halo-cta--newsletter_article').click()
    await expect(page).toHaveURL(/\/beta$/)
    await expect(page.getByRole('heading', { name: 'Help us make Oro yours.' })).toBeVisible()
  })
}

test.describe('auto-open waitlist modal', () => {
  // Opt out of storage seeding so the once-per-session auto-open fires.
  test.use({ seedStorage: false })

  test('opens once per session on a newsletter page', async ({ page }) => {
    await page.goto(`/newsletter/${RELEASED_SLUG}`, { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.modal-backdrop')).toBeVisible({ timeout: 15000 })
    await page.locator('.modal-close-x').click()
    await expect(page.locator('.modal-backdrop')).toHaveCount(0)

    // Same session: navigating again must NOT reopen it.
    await page.goto(`/newsletter/${RELEASED_SLUG}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)
    await expect(page.locator('.modal-backdrop')).toHaveCount(0)
  })
})
