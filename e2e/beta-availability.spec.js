import { test, expect } from './fixtures.js'
import { formSteps } from '../src/components/beta/betaForm.js'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: false } }))
  await page.goto('/beta')
  await expect(page.getByRole('heading', { name: 'Help us make Oro yours.' })).toBeVisible()
  test.skip(await page.locator('.beta-draft-bar').count() > 0, 'Design previews keep the form available for testing')
})

for (const width of [1440, 390]) {
  test(`@smoke beta invitation ends with an availability notice at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const writes = []
    page.on('request', (request) => {
      const url = new URL(request.url())
      if (url.origin === 'https://vercel.live' && url.pathname === '/login/validate') return
      if (request.method() === 'POST') writes.push(request.url())
    })
    for (let index = 0; index < 6; index += 1) await page.getByRole('button', { name: 'Next page', exact: true }).click()
    await expect(page.getByText('Free lifetime access to Oro.', { exact: true }).first()).toBeVisible()
    await page.getByRole('button', { name: 'About beta invites', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Invites open soon.' })).toBeFocused()
    await expect(page.getByRole('link', { name: 'Email us' })).toHaveAttribute('href', 'mailto:sunny@buildingoro.ca')
    await expect(page.locator('form, input, textarea')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(writes).toEqual([])
    await page.getByRole('button', { name: 'Back to the invitation' }).click()
    await expect(page.getByRole('heading', { name: 'Help us make Oro yours.' })).toBeVisible()
  })
}

test('@smoke beta header and direct form links cannot open the unfinished form', async ({ page }) => {
  await page.getByRole('link', { name: 'Beta invites' }).click()
  await expect(page.getByRole('heading', { name: 'Invites open soon.' })).toBeVisible()
  for (const step of formSteps) {
    await page.goto(`/beta${step.hash}`)
    await expect(page.getByRole('heading', { name: 'Invites open soon.' })).toBeVisible()
    await expect(page.locator('form, input, textarea, .beta-draft-bar, .beta-receipt')).toHaveCount(0)
  }
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Invites open soon.' })).toBeVisible()
})
