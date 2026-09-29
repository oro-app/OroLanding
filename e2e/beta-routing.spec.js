import { test, expect } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: true } }))
})

test('beta invitation screens use bookmarkable query URLs and browser history', async ({ page }) => {
  await page.goto('/beta')
  await expect(page).toHaveURL(/\/beta\?step=landing$/)

  await page.getByRole('button', { name: 'See beta details', exact: true }).click()
  await expect(page).toHaveURL(/\/beta\?step=beta-details$/)
  await expect(page.getByRole('heading', { name: 'Help shape the future of oro.' })).toBeFocused()

  await page.getByRole('button', { name: 'Continue to invite', exact: true }).click()
  await expect(page).toHaveURL(/\/beta\?step=invite$/)

  await page.getByRole('button', { name: 'Request an invite', exact: true }).click()
  await expect(page).toHaveURL(/\/beta\?step=request$/)

  await page.goBack()
  await expect(page).toHaveURL(/\/beta\?step=invite$/)
  await expect(page.getByRole('heading', { name: 'Ready to help us make oro yours?' })).toBeFocused()

  await page.goBack()
  await expect(page).toHaveURL(/\/beta\?step=beta-details$/)
  await expect(page.getByRole('heading', { name: 'Help shape the future of oro.' })).toBeFocused()

  await page.goBack()
  await expect(page).toHaveURL(/\/beta\?step=landing$/)
  await expect(page.getByRole('heading', { name: 'Help us make oro yours.' })).toBeFocused()
})

test('a direct beta invitation link restores its screen', async ({ page }) => {
  await page.goto('/beta?step=invite')
  await expect(page.getByRole('heading', { name: 'Ready to help us make oro yours?' })).toBeVisible()
})

test('the removed last-outfit step falls back to the beta landing screen', async ({ page }) => {
  await page.goto('/beta?step=last-outfit')
  await expect(page).toHaveURL(/\/beta\?step=landing$/)
  await expect(page.getByRole('heading', { name: 'Help us make oro yours.' })).toBeVisible()
})

test('beta form steps use bookmarkable query URLs and browser history', async ({ page }) => {
  await page.goto('/beta?step=request')
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page).toHaveURL(/\/beta\?step=beta-details$/)
  await expect(page.getByRole('heading', { name: 'Help shape the future of oro.' })).toBeFocused()

  await page.goBack()
  await expect(page).toHaveURL(/\/beta\?step=request$/)
  await expect(page.getByRole('heading', { name: 'What should we call you?' })).toBeFocused()

  await page.goto('/beta?step=contact')
  await expect(page.getByRole('heading', { name: 'How can we reach you?' })).toBeVisible()

  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page).toHaveURL(/\/beta\?step=request$/)
  await expect(page.getByRole('heading', { name: 'What should we call you?' })).toBeFocused()

  await page.goBack()
  await expect(page).toHaveURL(/\/beta\?step=contact$/)
  await expect(page.getByRole('heading', { name: 'How can we reach you?' })).toBeFocused()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'How can we reach you?' })).toBeVisible()
})

test('legacy beta step fragments are canonicalized to query URLs', async ({ page }) => {
  await page.goto('/beta#used-oro')
  await expect(page).toHaveURL(/\/beta\?step=used-oro$/)
  await expect(page.getByRole('heading', { name: 'Have you used the oro app before?' })).toBeVisible()
})
