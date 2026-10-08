import { test, expect } from './fixtures.js'

for (const path of ['/beta', '/invite', '/beta/career', '/beta/dating']) {
  test(`${path} opens the text modal without the retired signup API`, async ({ page }) => {
    const requests = []
    await page.route('**/api/beta-request', (route) => {
      requests.push(route.request().url())
      return route.fulfill({ json: { enabled: false } })
    })
    await page.goto(path)
    await page.locator('.halo-cta--beta').click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.getByRole('dialog')).toContainText('Message frequency varies.')
    await expect(page.locator('input, textarea, .beta-draft-bar')).toHaveCount(0)
    expect(requests).toEqual([])
  })
}
