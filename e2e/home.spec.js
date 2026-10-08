import { test, expect } from './fixtures'

test('home page loads cleanly @smoke', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect(page).toHaveTitle(/oro/i)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('the ai fashion assistant you can text')
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-family', 'Fraunces, Georgia, serif')
  await expect(page.getByText(/600\+/)).toHaveCount(0)
  await expect(page.getByText(/Getting dressed is one text away/)).toBeVisible()
  expect(errors).toEqual([])
})

for (const place of ['header', 'hero', 'closer']) {
  test(`${place} CTA opens and dismisses the text modal`, async ({ page }) => {
    await page.goto('/')
    const trigger = page.locator(`.halo-cta--${place}`)
    await trigger.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: "get oro's number" })).toBeVisible()
    await expect(dialog.getByRole('img', { name: /QR code/ })).toBeVisible()
    const href = await dialog.getByRole('link', { name: 'text +1 (855) 676-2419' }).getAttribute('href')
    expect(decodeURIComponent(href)).toContain('I AGREE to receive recurring automated texts from oro')
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
    await expect(trigger).toBeFocused()
    await trigger.click()
    await dialog.getByRole('button', { name: 'Close', exact: true }).click()
    await expect(trigger).toBeFocused()
  })
}

for (const [device, separator] of [['iPhone', '&'], ['Android', '?']]) {
  test(`${device} opens the modal with a consent-bearing phone link`, async ({ page }) => {
    await page.addInitScript((value) => Object.defineProperty(navigator, 'userAgent', { value }), device)
    await page.goto('/')
    await page.locator('.halo-cta--hero').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const href = await dialog.getByRole('link', { name: 'text +1 (855) 676-2419' }).getAttribute('href')
    expect(href.startsWith(`sms:+18556762419${separator}body=`)).toBe(true)
    expect(decodeURIComponent(href)).toContain('I AGREE')
  })
}

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
  await expect(page.getByRole('heading', { name: 'Look like yourself. Feel ready for anything.' })).toBeInViewport()
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
  await expect(cta).toHaveCSS('transition-duration', '0s')
  await expect(page.locator('#closer-title')).toHaveCSS('opacity', '1')
})
