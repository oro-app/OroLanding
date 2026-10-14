import { test, expect } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/beta-count', (route) => route.fulfill({ json: { count: 0 } }))
})

test('scrolling sends and reverses the demo conversation in both channels', async ({ page }) => {
  const requests = []
  page.on('request', (request) => { if (request.method() !== 'GET') requests.push(request.url()) })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('.oro-intro')).toHaveClass(/oro-scrollchat/)
  await expect(page.locator('.oro-chat-pending')).toHaveCount(6)
  await page.evaluate(() => {
    const section = document.querySelector('.oro-intro')
    const start = section.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(section).paddingTop) - parseFloat(section.style.getPropertyValue('--oro-pin-top'))
    window.scrollTo({ top: start + 1550, behavior: 'instant' })
  })
  await expect(page.locator('.oro-chat-pending')).toHaveCount(0)
  const button = page.getByRole('button', { name: 'for WhatsApp' })
  await button.click()
  await expect(button).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('region', { name: 'WhatsApp conversation demo' })).toBeVisible()
  await expect(page.locator('.oro-wa-msg.is-in')).toHaveCount(6)
  await expect(page.locator('.oro-wa-phone')).toHaveAttribute('aria-hidden', 'false')
  await expect(page.locator('.product-demo')).toHaveAttribute('aria-hidden', 'true')
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(page.locator('.oro-chat-pending')).toHaveCount(6)
  await expect(page.locator('.oro-wa-msg.is-pending')).toHaveCount(6)
  expect(requests).toEqual([])
})

test('reduced motion exposes a readable conversation and every feature', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.oro-intro')).not.toHaveClass(/oro-scrollchat/)
  await expect(page.locator('.oro-chat-pending')).toHaveCount(0)
  await expect(page.locator('.oro-marquee-track')).toHaveCSS('animation-name', 'none')
  for (const heading of await page.locator('.oro-grid-title').all()) {
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toBeInViewport()
  }
  await page.getByRole('button', { name: 'for WhatsApp' }).click()
  await expect(page.locator('.oro-wa-msg.is-in')).toHaveCount(6)
})

for (const width of [320, 390, 768, 1440]) {
  test(`design sections stay within the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    for (const selector of ['.oro-intro', '.oro-marquee', '.oro-grid']) {
      await page.locator(selector).scrollIntoViewIfNeeded()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      expect(overflow).toBeLessThanOrEqual(1)
    }
    const missingImages = await page.locator('img').evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src))
    expect(missingImages).toEqual([])
  })
}
