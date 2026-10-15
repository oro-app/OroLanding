import { test, expect } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/checkout?*', route => route.fulfill({ status: 503, json: {} }))
})

test('home page loads cleanly @smoke', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page).toHaveTitle(/oro/i)
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('aria-label', 'the ai fashion assistant you can text')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', 'Fraunces, Georgia, serif')
  await expect(page.getByText(/600\+/)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'text her when you don’t know what to wear' })).toBeVisible()
  expect(errors).toEqual([])
})

for (const place of ['header', 'hero', 'closer']) {
  test(`${place} CTA opens checkout directly`, async ({ page }) => {
    await page.goto('/')
    const cta = page.locator(`.halo-cta--${place}`)
    await expect(cta).toHaveAttribute('href', '/checkout')
    await cta.click()
    await expect(page).toHaveURL(/\/checkout(?:\?|$)/)
    await expect(page.getByRole('region', { name: 'Oro subscription checkout' })).toBeVisible()
    await expect(page.locator('video')).toHaveCount(0)
  })
}

test('all CTAs share one purple treatment', async ({ page }) => {
  await page.goto('/')
  const header = page.locator('.halo-cta--header')
  const hero = page.locator('.halo-cta--hero')
  const closer = page.locator('.halo-cta--closer')
  const heroStyle = await hero.evaluate((element) => {
    const style = getComputedStyle(element)
    return { width: style.width, height: style.height, backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage }
  })
  await closer.scrollIntoViewIfNeeded()
  const closerStyle = await closer.evaluate((element) => {
    const style = getComputedStyle(element)
    return { width: style.width, height: style.height, backgroundColor: style.backgroundColor, backgroundImage: style.backgroundImage }
  })
  expect(closerStyle).toEqual(heroStyle)
  await expect(header).toHaveCSS('background-color', 'rgb(87, 57, 105)')
  expect(heroStyle.backgroundImage).toContain('conic-gradient')
  await expect(header).toContainText('meet oro')
  await expect(header.locator('.halo-cta-message')).toHaveCount(0)
  await expect(hero.locator('.oro-cta-pixels')).toHaveCount(1)
  await expect(page.locator('.halo-cta-message circle')).toHaveCount(0)


})

test('centered hero gives way to the rest of the page on scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.halo-home')).toHaveAttribute('data-motion', 'ready')
  await expect(page.locator('.mt-device')).toHaveCount(0)
  await expect(page.locator('.halo-cta--hero')).toContainText('find your next outfit')
  const heading = page.getByRole('heading', { level: 1 })
  const headingTop = await heading.evaluate((element) => element.getBoundingClientRect().top)
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }))
  expect(await heading.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(headingTop - 300, 0)
  await page.locator('.oro-marquee').scrollIntoViewIfNeeded()
  await expect(page.getByRole('region', { name: 'she gets your style. and your life.' })).toBeInViewport()
  await expect(page.locator('.home-panel[aria-hidden="true"]')).toHaveCount(0)
})

for (const width of [320, 1440]) {
  test(`bottom CTA follows scroll position at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    const floating = page.locator('.home-floating-cta')
    const cta = floating.getByRole('link', { name: 'find your next outfit' })
    await expect(page.locator('.halo-cta--header')).toHaveText('meet oro')
    await expect(floating).toHaveAttribute('inert', '')
    await expect(floating).toBeHidden()
    await page.locator('.oro-marquee').scrollIntoViewIfNeeded()
    await expect(floating).toBeVisible()
    await expect(floating).not.toHaveAttribute('inert')
    await expect(floating).toHaveCSS('position', 'fixed')
    await expect(cta).toHaveAttribute('href', '/checkout')
    const bounds = await cta.boundingBox()
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    await page.locator('.halo-footer--landing').scrollIntoViewIfNeeded()
    await expect(floating).toBeHidden()
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect(floating).toBeHidden()
    await expect(floating).toHaveAttribute('inert', '')
    await page.locator('.oro-marquee').scrollIntoViewIfNeeded()
    await expect(floating).toBeVisible()
    await cta.click()
    await expect(page).toHaveURL(/\/checkout(?:\?|$)/)
  })
}

for (const width of [320, 390, 768, 1440]) {
  test(`homepage fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.locator('.halo-cta--hero')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.locator('.mt-device')).toHaveCount(0)
  })
}

test('Halo stays light without changing a saved dark preference', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('oro_theme', 'dark'))
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.halo-site')).toHaveCSS('background-color', 'rgb(252, 251, 255)')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.home-panel[aria-hidden="true"]')).toHaveCount(0)
  await page.locator('.halo-cta--header').click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('enabling reduced motion immediately reveals all page content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('.oro-intro')).toHaveClass(/oro-scrollchat/)
  await expect(page.locator('.oro-chat-pending')).toHaveCount(6)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('.oro-chat-pending')).toHaveCount(0)
  await expect(page.locator('.oro-intro')).not.toHaveClass(/oro-scrollchat/)
  const movingElements = page.locator('.home-type-char, .home-enter, .home-stagger')
  for (const element of await movingElements.all()) {
    await expect(element).toHaveCSS('opacity', '1')
    await expect(element).toHaveCSS('transform', 'none')
    await expect(element).toHaveCSS('animation-name', 'none')
  }
})

test('keyboard focus makes the final call to action readable immediately', async ({ page }) => {
  await page.goto('/')
  const cta = page.locator('.halo-cta--closer')
  await cta.focus()
  await expect(cta).toBeFocused()
  await expect(cta).toHaveCSS('opacity', '1')
  await expect(cta).toHaveCSS('transform', 'none')
  await expect(page.locator('#closer-title')).toHaveCSS('opacity', '1')
})
