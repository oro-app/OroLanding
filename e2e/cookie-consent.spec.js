import { test, expect } from './fixtures'

// These tests need the banner, so opt out of the default consent seeding.
test.use({ seedStorage: false })

const banner = (page) => page.getByRole('dialog', { name: 'Cookie consent' })

test('banner shows when no consent is stored', async ({ page }) => {
  await page.goto('/')
  await expect(banner(page)).toBeVisible()
})

test('accept stores consent and loads GA', async ({ page }) => {
  await page.goto('/')
  // Start listening only once the page is up so slow loads don't eat the timeout.
  const gaRequest = page.waitForRequest(/googletagmanager\.com\/gtag\/js/, { timeout: 15000 })
  await page.getByRole('button', { name: 'accept' }).click()
  await expect(banner(page)).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('oro_cookie_consent'))).toBe('accepted')
  await gaRequest // resolves only if GA actually loaded
})

test('decline stores refusal and never loads GA', async ({ page }) => {
  let gaRequested = false
  page.on('request', (req) => {
    if (/googletagmanager\.com/.test(req.url())) gaRequested = true
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'no thanks' }).click()
  await expect(banner(page)).toHaveCount(0)
  expect(await page.evaluate(() => localStorage.getItem('oro_cookie_consent'))).toBe('declined')

  // Reload: banner must not reappear, GA must stay absent.
  await page.reload()
  await page.waitForTimeout(2000)
  await expect(banner(page)).toHaveCount(0)
  expect(gaRequested).toBe(false)
})
