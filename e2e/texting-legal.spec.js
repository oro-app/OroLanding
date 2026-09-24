import { test, expect, deploymentOnly } from './fixtures'

test('website legal navigation points to texting policies', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const footer = page.locator('footer')
  await expect(footer.locator('a[href="/terms"]')).toBeVisible()
  await expect(footer.locator('a[href="/privacy"]')).toBeVisible()
  await expect(page.locator('header a[href^="/app/"], footer a[href^="/app/"]')).toHaveCount(0)
})

test.describe('separate texting and app policies', () => {
  test.beforeEach(deploymentOnly)

  for (const [path, heading, otherPolicy] of [
    ['/terms', 'Terms of service', '/privacy'],
    ['/privacy', 'Privacy policy', '/terms'],
  ]) {
    test(`${path} serves its own styled legal document @smoke`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
      await expect(page.locator('header nav a').filter({ hasText: /terms|privacy/i })).toHaveAttribute('href', otherPolicy)
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(252, 251, 255)')
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://www.askoro.now${path}`)
      await expect(page.locator('header a[href^="/app/"], footer a[href^="/app/"]')).toHaveCount(0)
    })
  }

  test('app policy URLs serve the preserved documents', async ({ request }) => {
    const terms = await request.get('/app/terms')
    const privacy = await request.get('/app/privacy')
    expect(terms.status()).toBe(200)
    expect(privacy.status()).toBe(200)
    expect(await terms.text()).toContain('Effective: June 30, 2026')
    expect(await terms.text()).toContain('This licence is further limited to use of the Service on any Apple-branded products')
    expect(await privacy.text()).toContain('Effective: July 24, 2026')
    expect(await privacy.text()).toContain('actively acknowledge the updated Policy within the app')
    expect(await terms.text()).toContain('href="/app/privacy"')
    expect(await privacy.text()).toContain('href="/app/terms"')
  })
})
