import { test, expect } from './fixtures'

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
  test(`${place} CTA opens the text handoff`, async ({ page }) => {
    await page.goto('/')
    const cta = page.locator(`.halo-cta--${place}`)
    await cta.click()
    const dialog = page.getByRole('dialog', { name: "get oro's number" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('+1 (855) 676-2419')).toBeVisible()
    await expect(dialog.getByAltText('QR code to start a text with oro')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(cta).toBeFocused()
  })
}

test('mobile get-her-number CTA is a prefilled SMS deep link', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    })
  })
  await page.goto('/')
  const cta = page.locator('.halo-cta--hero')
  await expect(cta).toHaveAttribute('href', `sms:+18556762419&body=${encodeURIComponent('Hey oro! Your newest oronaut has landed 🚀')}`)
  await expect(page.getByText('text oro — no app needed')).toHaveCount(0)
})

test('get-her-number handoff records CTA and modal analytics', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('oro_cookie_consent', 'accepted')
    window.dataLayer = []
    window.gtag = (...args) => window.dataLayer.push(args)
  })
  await page.goto('/')
  await page.locator('.halo-cta--hero').click()
  await expect.poll(() => page.evaluate(() => window.dataLayer.some((entry) => (
    Array.isArray(entry)
      && entry[0] === 'event'
      && entry[1] === 'get_number_click'
      && entry[2]?.location === 'hero'
      && entry[2]?.destination === 'qr_handoff'
  )))).toBe(true)
  await expect.poll(() => page.evaluate(() => window.dataLayer.some((entry) => (
    Array.isArray(entry)
      && entry[0] === 'event'
      && entry[1] === 'text_handoff_open'
      && entry[2]?.location === 'hero'
  )))).toBe(true)
})

test('all CTAs share one purple treatment and the handoff keeps the same visual language', async ({ page }) => {
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
  await expect(header).toHaveCSS('background-color', heroStyle.backgroundColor)
  await expect(hero).toHaveCSS('background-color', 'rgb(87, 57, 105)')
  await expect(header).toContainText('want her number?')
  await expect(header.locator('.halo-cta-message')).toHaveCount(0)
  expect(heroStyle.backgroundImage).toBe('none')
  await expect(page.locator('.halo-cta-message circle')).toHaveCount(0)

  await hero.click()
  const dialog = page.getByRole('dialog', { name: "get oro's number" })
  await expect(dialog.getByRole('heading', { name: "get oro's number" })).toHaveCSS('font-family', 'Fraunces, Georgia, serif')
  await expect(dialog.locator('.text-oro-number svg')).toHaveCSS('color', heroStyle.backgroundColor)
  await expect(dialog.locator('.text-oro-number-value')).toHaveCSS('color', heroStyle.backgroundColor)
  await expect(dialog.locator('.text-oro-number-value')).toHaveCSS('text-decoration-line', 'underline')
  await expect(dialog.getByText(/scan the code with your phone/i)).toHaveCount(0)
  await expect(dialog.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
  await expect(dialog.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
})

test('centered hero gives way to the rest of the page on scroll', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.halo-home')).toHaveAttribute('data-motion', 'ready')
  await expect(page.locator('.mt-device')).toHaveCount(0)
  await expect(page.locator('.halo-cta--hero')).toContainText('get her number')
  const heading = page.getByRole('heading', { level: 1 })
  const headingTop = await heading.evaluate((element) => element.getBoundingClientRect().top)
  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }))
  expect(await heading.evaluate((element) => element.getBoundingClientRect().top)).toBeCloseTo(headingTop - 300, 0)
  await page.locator('#home-moments-title').scrollIntoViewIfNeeded()
  await expect(page.getByRole('heading', { name: 'she gets your style. and your life.' })).toBeInViewport()
  await expect(page.locator('.home-panel[aria-hidden="true"]')).toHaveCount(0)
})

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
  await expect(page.locator('.home-feature-copy').first()).toHaveCSS('opacity', '0')
  await page.emulateMedia({ reducedMotion: 'reduce' })
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
