import { test, expect } from './fixtures'

test('home page loads cleanly @smoke', async ({ page }) => {
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })

  await page.goto('/')
  await expect(page).toHaveTitle(/oro/i)
  // TheJournal is the live newsletter section on the home page.
  await expect(page.getByRole('button', { name: 'join the mailing list' })).toBeVisible()
  expect(consoleErrors).toEqual([])
})
