import { test, expect } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/checkout?*', route => route.fulfill({ status: 503, json: {} }))
})

test('home page loads cleanly @smoke', async ({ page }) => {
  const errors = []
  const betaCountRequests = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/beta-count') betaCountRequests.push(request.url())
  })
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`)
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page).toHaveTitle(/oro/i)
  await expect(page.getByRole('heading', { level: 1 })).toHaveAttribute('aria-label', 'the ai fashion assistant you can text')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', 'Fraunces, Georgia, serif')
  await expect(page.getByText(/600\+/)).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'text her when you don’t know what to wear' })).toBeVisible()
  expect(betaCountRequests, 'The homepage must not request the retired beta signup count').toEqual([])
  expect(errors).toEqual([])
})

const SMS_LINK = /^sms:\+18556762419[?&]body=/

for (const place of ['header', 'hero', 'closer']) {
  test(`${place} CTA opens the desktop QR handoff`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const cta = page.locator(`.halo-cta--${place}`)
    await expect(cta).toHaveAttribute('href', SMS_LINK)
    await cta.click()
    const dialog = page.getByRole('dialog', { name: "get oro's number" })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('+1 (855) 676-2419')).toBeVisible()
    await expect(dialog.getByAltText('QR code to start a text with oro')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    await expect(dialog.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(cta).toBeFocused()
    await expect(page).toHaveURL(/\/$/)
  })
}

test('QR handoff takes a number for the waitlist', async ({ page }) => {
  const requests = []
  await page.route('**/api/request-access', async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({ status: 202, json: { status: 'requested' } })
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('.halo-cta--hero').click()
  const dialog = page.getByRole('dialog', { name: "get oro's number" })
  const submit = dialog.getByRole('button', { name: 'request access' })
  await dialog.getByLabel("leave your number and we'll reach out").fill('(416) 555-0123')
  await expect(submit).toBeDisabled()
  await dialog.getByRole('checkbox').check()
  await submit.click()
  await expect(dialog.getByRole('status')).toContainText("you're on the list")
  expect(requests).toEqual([{ phone: '(416) 555-0123', terms_accepted: true, texting_consent: true }])
  await expect(dialog.getByAltText('QR code to start a text with oro')).toBeVisible()
})

test('waitlist form explains a rejected number and keeps it for editing', async ({ page }) => {
  await page.route('**/api/request-access', route => route.fulfill({ status: 400, json: { code: 'invalid_phone' } }))
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.locator('.halo-cta--hero').click()
  const dialog = page.getByRole('dialog', { name: "get oro's number" })
  const input = dialog.getByLabel("leave your number and we'll reach out")
  await input.fill('+44 7911 123456')
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'request access' }).click()
  await expect(dialog.getByRole('alert')).toHaveText('enter a US or Canadian number.')
  await expect(input).toHaveValue('+44 7911 123456')
})

test('mobile CTA is a prefilled SMS deep link without the QR modal', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    })
  })
  await page.goto('/')
  const cta = page.locator('.halo-cta--hero')
  await expect(cta).toHaveAttribute('href', `sms:+18556762419&body=${encodeURIComponent("hey oro, let's get started!")}`)
})

test('CTA handoff records click and modal analytics', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('oro_cookie_consent', 'accepted')
    window.dataLayer = []
    window.gtag = (...args) => window.dataLayer.push(args)
  })
  await page.setViewportSize({ width: 1440, height: 900 })
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
    await expect(cta).toHaveAttribute('href', SMS_LINK)
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
    await expect(page.getByRole('dialog', { name: "get oro's number" })).toBeVisible()
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
  await page.goto('/checkout')
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
