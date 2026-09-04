import { test, expect } from './fixtures'

test('home page loads cleanly @smoke', async ({ page }) => {
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/')
  await expect(page).toHaveTitle(/oro/i)
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ai stylist you can text')
  expect(consoleErrors).toEqual([])
})

test('every home CTA goes to /get-started', async ({ page }) => {
  await page.goto('/')
  // Header, hero and closing block; the hero one carries its own label.
  await expect(page.locator('.site-cta')).toHaveCount(3)
  await expect(page.locator('.site-cta--hero')).toHaveText('start the conversation')

  await page.locator('.site-cta--hero').click()
  await expect(page).toHaveURL(/\/get-started$/)
})
