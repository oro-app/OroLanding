import { test, expect } from './fixtures'

const painted = page => page.locator('.gold-background').evaluate(canvas => {
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
  return pixels.some((value, index) => index % 4 === 3 && value > 0)
})

for (const route of ['/', '/beta', '/get-started']) {
  test(`gold follows the pointer and fades on ${route}`, async ({ page }) => {
    await page.goto(route)
    await page.mouse.move(100, 200)
    await page.mouse.move(500, 300, { steps: 12 })
    await expect.poll(() => painted(page)).toBe(true)
    await expect.poll(() => painted(page), { timeout: 4000 }).toBe(false)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.mouse.move(300, 250, { steps: 8 })
    await expect(page.locator('.gold-background')).toBeHidden()
    await expect.poll(() => painted(page)).toBe(false)
  })
}

test.describe('touch devices', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
  test('keep a still background', async ({ page }) => {
    await page.goto('/')
    await page.touchscreen.tap(80, 250)
    await expect(page.locator('.gold-background')).toBeAttached()
    await expect(page.locator('.gold-background')).toBeHidden()
    expect(await painted(page)).toBe(false)
  })
})
