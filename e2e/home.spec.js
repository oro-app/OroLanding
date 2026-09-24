import { test, expect } from './fixtures'

test('home page loads cleanly @smoke', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page).toHaveTitle(/oro/i)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The #1 AI stylist you can text')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', '"DM Sans", sans-serif')
  await expect(page.getByText(/600\+/)).toHaveCount(0)
  await expect(page.getByText('Currently in beta.')).toBeVisible()
  expect(errors).toEqual([])
})

for (const place of ['header', 'hero', 'closer']) {
  test(`${place} CTA opens the beta invitation`, async ({ page }) => {
    await page.goto('/')
    await page.locator(`.halo-cta--${place}`).click()
    await expect(page).toHaveURL(/\/beta$/)
    await expect(page.getByRole('heading', { name: 'Help us make Oro yours.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Skip to the form' })).toBeVisible()
  })
}

test('left content scrolls normally while the phone stays pinned', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.halo-home')).toHaveAttribute('data-motion', 'ready')
  await expect(page.locator('.mt-device')).toHaveCSS('transform', 'none')
  const heading = page.getByRole('heading', { level: 1 })
  const headingTop = await heading.evaluate((element) => element.getBoundingClientRect().top)
  const phoneTop = await page.locator('.mt-device').evaluate((element) => element.getBoundingClientRect().top)
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }))
  expect(await heading.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(headingTop - 600, 0)
  expect(await page.locator('.mt-device').evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(phoneTop, 0)
  await expect(page.getByRole('heading', { name: 'Look like yourself. Feel ready for anything.' })).toBeInViewport()
  await expect(page.locator('.home-panel[aria-hidden="true"]')).toHaveCount(0)
})

test('the phone demo plays messages', async ({ page }) => {
  await page.goto('/')
  const thread = page.getByRole('region', { name: 'Example conversation with Oro' })
  await expect(thread).toBeVisible()
  await expect(thread).toContainText('I have class', { timeout: 5000 })
  await expect(thread).toContainText('Cold and grey today', { timeout: 6000 })
})

for (const width of [320, 390, 768, 1440]) {
  test(`homepage fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.halo-cta--hero')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.getByRole('region', { name: 'Example conversation with Oro' })).toBeVisible()
    if (width <= 900) {
      const layout = await page.evaluate(() => ({
        phone: document.querySelector('.mt-device').getBoundingClientRect().top,
        hero: document.querySelector('.home-panel').getBoundingClientRect().bottom,
        second: document.querySelectorAll('.home-panel')[1].getBoundingClientRect().top,
      }))
      expect(layout.phone).toBeGreaterThan(layout.hero)
      expect(layout.phone).toBeLessThan(layout.second)
    }
  })
}

test('Halo stays light without changing a saved dark preference', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('oro_theme', 'dark'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.halo-site')).toHaveCSS('background-color', 'rgb(252, 251, 255)')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.home-panel[aria-hidden="true"]')).toHaveCount(0)
  await expect(page.locator('.mt-thread')).toContainText("I'm wearing this")
  await page.locator('.halo-cta--header').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('enabling reduced motion immediately reveals all page content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('#home-reasons-title')).toHaveCSS('opacity', '0')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const movingElements = page.locator('.home-type-char, .home-enter, .home-stagger, .mt-device')
  for (const element of await movingElements.all()) {
    await expect(element).toHaveCSS('opacity', '1')
    await expect(element).toHaveCSS('transform', 'none')
    await expect(element).toHaveCSS('animation-name', 'none')
  }
  for (const check of await page.locator('.home-check path').all()) {
    await expect(check).toHaveCSS('stroke-dashoffset', '0px')
  }
})

test('keyboard focus makes the final call to action readable immediately', async ({ page }) => {
  await page.goto('/')
  const cta = page.locator('.halo-cta--closer')
  await cta.focus()
  await expect(cta).toBeFocused()
  await expect(cta).toHaveCSS('opacity', '1')
  await expect(cta).toHaveCSS('transform', 'none')
  await expect(cta).toHaveCSS('transition-duration', '0s')
  await expect(page.locator('#closer-title')).toHaveCSS('opacity', '1')
})
