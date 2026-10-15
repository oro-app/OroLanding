import { test, expect } from './fixtures.js'

const skipName = 'skip video and continue to checkout'

test.use({ seedStorage: false })

test.describe('the recording before hydration', () => {
  test.use({ javaScriptEnabled: false, seedStorage: false })

  for (const width of [390, 1440]) {
    test(`the built page is an immersive native player without JavaScript at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const response = await page.goto('/meet-oro')
      const html = await response.text()
      test.skip(html.includes('/@vite/client'), 'Requires a production build with prerendered route HTML')

      await expect(page.locator('header, footer, .cookie-consent-wrap')).toHaveCount(0)
      await expect(page.locator('.meet-oro-accessible')).toHaveCSS('clip-path', 'inset(50%)')
      await expect(page.getByRole('checkbox')).toHaveCount(0)
      await expect(page.locator('.meet-oro--immersive')).toBeVisible()
      const video = page.locator('video')
      await expect(video).toHaveCount(1)
      await expect(video).toBeVisible()
      await expect(video).toHaveAttribute('controls', '')
      await expect(video).toHaveAttribute('autoplay', '')
      await expect(video).toHaveAttribute('muted', '')
      await expect(video).toHaveAttribute('playsinline', '')
      await expect.poll(() => video.evaluate(element => !element.paused && element.currentTime > 0)).toBe(true)
      const box = await video.boundingBox()
      expect(box.width).toBeGreaterThan(200)
      expect(box.height).toBeGreaterThan(400)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.y).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      expect(box.y + box.height).toBeLessThanOrEqual(1000)
      const skip = page.getByRole('link', { name: skipName, exact: true })
      await expect(skip).toBeInViewport()
      await expect(skip).toHaveAttribute('href', '/checkout')
      await expect(skip).toHaveCSS('box-shadow', 'none')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(1000)
    })
  }
})

test('a cold player load and hard refresh reveal the recording once without a layout flash', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/api/**', route => route.fulfill({ status: 503, json: {} }))
  await page.route('**/*.js', async route => {
    await new Promise(resolve => setTimeout(resolve, 650))
    await route.continue()
  })
  await page.addInitScript(() => {
    window.oroPaintSamples = []
    window.oroRevealAnimations = 0
    document.addEventListener('animationstart', event => {
      if (event.target.matches('.meet-oro-stage')) window.oroRevealAnimations += 1
    })
    const sample = () => {
      const stage = document.querySelector('.meet-oro-stage')
      if (stage) {
        const bounds = stage.getBoundingClientRect()
        window.oroPaintSamples.push({
          questionCount: document.querySelectorAll('.meet-oro-question').length,
          opacity: Number(getComputedStyle(stage).opacity),
          width: bounds.width,
          height: bounds.height,
          viewportWidth: innerWidth,
          viewportHeight: innerHeight,
        })
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })

  for (const refresh of [false, true]) {
    const response = refresh
      ? await page.reload({ waitUntil: 'commit' })
      : await page.goto('/meet-oro#demo', { waitUntil: 'commit' })
    test.skip((await response.text()).includes('/@vite/client'), 'Requires a production build with prerendered route HTML')
    await page.waitForLoadState('networkidle')
    const stage = page.locator('.meet-oro-stage')
    await expect(stage).toHaveCSS('opacity', '1')
    const samples = await page.evaluate(() => window.oroPaintSamples)
    expect(samples.some(sample => sample.opacity < 1)).toBe(true)
    expect(samples.every((sample, index) => index === 0 || sample.opacity >= samples[index - 1].opacity - 0.001)).toBe(true)
    expect(samples.every(sample => sample.questionCount === 0)).toBe(true)
    expect(samples.every(sample => Math.abs(sample.width - sample.viewportWidth) <= 1 && Math.abs(sample.height - sample.viewportHeight) <= 1)).toBe(true)
    expect(await page.evaluate(() => window.oroRevealAnimations)).toBe(1)
    await expect(page.locator('header, footer, .cookie-consent-wrap')).toHaveCount(0)
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    await expect(page.locator('video')).toHaveCount(1)
    await expect.poll(() => page.locator('video').evaluate(element => !element.paused && element.currentTime > 0)).toBe(true)
  }
  expect(errors).toEqual([])
})
