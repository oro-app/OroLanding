import { test, expect, deploymentOnly } from './fixtures'

test('old referral parameters do not enter the text draft', async ({ page }) => {
  await page.goto('/?ref=retired&invite=https%3A%2F%2Faskoro.now%2Finvite%3Fref%3Dold')
  const cta = page.locator('.halo-cta--hero')
  await expect(cta).toHaveText('join the waitlist')
  const href = await cta.getAttribute('href')
  expect(decodeURIComponent(href)).toMatch(/^sms:\+18556762419[?&]body=hey oro, let's get started!$/)
  await cta.click()
  const dialog = page.getByRole('dialog', { name: "get oro's number" })
  await expect(dialog).toBeVisible()
  await expect(dialog).toContainText('join the waitlist')
  await expect(dialog.getByAltText('QR code to start a text with oro')).toBeVisible()
  await expect(dialog.locator('form')).toHaveCount(0)
})

test.describe('retired signup links', () => {
  test.beforeEach(deploymentOnly)
  for (const path of ['/beta', '/beta/career', '/beta/dating', '/invite?ref=retired', '/tester/referrals', '/getstarted', '/get-started', '/get-started/setup', '/meet-oro']) {
    test(`${path} reaches the homepage texting entry`, async ({ page }) => {
      await page.goto(path)
      expect(new URL(page.url()).pathname).toBe('/')
      await expect(page.locator('.halo-cta--hero')).toHaveText('join the waitlist')
      await expect(page.locator('.halo-cta--hero')).toHaveAttribute('href', /^sms:\+18556762419[?&]body=/)
    })
  }
})
