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
  const ctas = page.getByRole('button', { name: 'get started' })
  await expect(ctas).toHaveCount(3)

  await ctas.first().click()
  await expect(page).toHaveURL(/\/get-started$/)
})
