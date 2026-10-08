import { test, expect } from './fixtures.js'

test('desktop handoff has a QR, phone fallback and no account-creation requests', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  const writes = []
  page.on('request', request => { if (request.method() === 'POST') writes.push(request.url()) })
  await page.goto('/get-started')
  await expect(page.getByRole('heading', { name: 'one text away from your next fit.' })).toBeVisible()
  await expect(page.getByAltText('QR code to open this page on your phone')).toBeVisible()
  await expect(page.getByRole('link', { name: 'text oro', exact: true })).toHaveAttribute('href', /^sms:\+18556762419[?&]body=/)
  await expect(page.getByRole('link', { name: '+1 (855) 676-2419' })).toHaveAttribute('href', 'sms:+18556762419')
  expect(await page.locator('input').count()).toBe(0)
  expect(writes).toEqual([])
})

test('phone handoff keeps the action visible and hides the desktop QR', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('oro_cookie_consent', 'declined'))
  await page.goto(`${process.env.E2E_BASE_URL}/get-started`)
  const cta = page.getByRole('link', { name: 'text oro', exact: true })
  await expect(cta).toHaveAttribute('href', /^sms:\+18556762419&body=/)
  await expect(page.getByAltText('QR code to open this page on your phone')).toBeHidden()
  const bounds = await cta.boundingBox()
  expect(bounds.y + bounds.height).toBeLessThan(844)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await context.close()
})

test('Android handoff uses the message body separator and QR links preserve the page', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Linux; Android 15) Chrome/130 Mobile' })
  const page = await context.newPage()
  await page.addInitScript(() => localStorage.setItem('oro_cookie_consent', 'declined'))
  await page.goto(`${process.env.E2E_BASE_URL}/get-started?from=qr`)
  await expect(page.getByRole('link', { name: 'text oro', exact: true })).toHaveAttribute('href', /^sms:\+18556762419\?body=/)
  await context.close()
})
