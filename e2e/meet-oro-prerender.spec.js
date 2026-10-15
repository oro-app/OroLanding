import { test, expect } from './fixtures.js'

test.describe('the demo before hydration', () => {
  test.use({ javaScriptEnabled: false })

  for (const width of [390, 1440]) {
    test(`the built page is styled and readable without JavaScript at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      const response = await page.goto('/meet-oro/')
      const html = await response.text()
      test.skip(html.includes('/@vite/client'), 'Requires a production build with prerendered route HTML')

      await expect(page.getByRole('checkbox')).toHaveCount(0)
      await expect(page.getByText('what’s the hardest part of getting dressed?', { exact: true })).toHaveCount(0)
      await expect(page.locator('.meet-oro-layout')).toHaveCSS('display', 'grid')
      const video = page.locator('.meet-oro-demo video')
      await expect(video).toHaveCount(1)
      await expect(video).toBeVisible()
      await expect(video).toHaveAttribute('controls', '')
      const box = await video.boundingBox()
      expect(box.width).toBeGreaterThanOrEqual(200)
      expect(box.width).toBeLessThanOrEqual(400)
      expect(box.height / box.width).toBeCloseTo(1298 / 600, 1)
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
      await expect(page.locator('#meet-oro-video-caption')).toBeVisible()
      const button = page.getByRole('link', { name: 'let oro help you get dressed', exact: true })
      await expect(button).toBeVisible()
      await expect(button).toHaveAttribute('href', '/checkout')
      await expect(button).toHaveCSS('box-shadow', 'none')
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    })
  }
})

test('a cold demo load and refresh reveal the recording once without a question', async ({ page }) => {
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
      if (stage) window.oroPaintSamples.push({
        questionCount: document.querySelectorAll('.meet-oro-question').length,
        opacity: Number(getComputedStyle(stage).opacity),
      })
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })

  for (const refresh of [false, true]) {
    const response = refresh
      ? await page.reload({ waitUntil: 'commit' })
      : await page.goto('/meet-oro/#demo', { waitUntil: 'commit' })
    test.skip((await response.text()).includes('/@vite/client'), 'Requires a production build with prerendered route HTML')
    await page.waitForLoadState('networkidle')
    const demo = page.locator('.meet-oro-stage')
    await expect(demo).toHaveCSS('opacity', '1')
    const samples = await page.evaluate(() => window.oroPaintSamples)
    expect(samples.some(sample => sample.opacity < 1)).toBe(true)
    expect(samples.every((sample, index) => index === 0 || sample.opacity >= samples[index - 1].opacity - 0.001)).toBe(true)
    expect(samples.every(sample => sample.questionCount === 0)).toBe(true)
    expect(await page.evaluate(() => window.oroRevealAnimations)).toBe(1)
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    await expect(page.locator('video')).toHaveCount(1)
  }
  expect(errors).toEqual([])
})
