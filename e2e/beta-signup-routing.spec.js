import { test, expect } from './fixtures.js'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/checkout?*', route => route.fulfill({ status: 503, json: {} }))
})

test('invite landing carries the invitation into the prefilled text', async ({ page }) => {
  const referralCode = 'b'.repeat(64)
  await page.goto(`/invite?ref=${referralCode}&src=ig-sunny&step=phone`)
  const cta = page.locator('.beta-welcome .halo-cta--beta_general')
  const inviteUrl = `${new URL(page.url()).origin}/invite?ref=${referralCode}`
  const body = encodeURIComponent(`hey oro, let's get started!\n${inviteUrl}`)
  await expect(cta).toHaveAttribute('href', new RegExp(`^sms:\\+18556762419[?&]body=${body.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`))
  const requests = []
  await page.route('**/api/request-access', async (route) => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({ status: 202, json: { status: 'requested' } })
  })
  await cta.click()
  const dialog = page.getByRole('dialog', { name: "get oro's number" })
  await dialog.getByLabel("leave your number and we'll reach out").fill('4165550123')
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'request access' }).click()
  await expect(dialog.getByRole('status')).toBeVisible()
  expect(requests[0].referral_code).toBe(referralCode)
})

for (const [path, title, place] of [
  ['/beta', 'heard you were looking for my number.', 'beta_general'],
  ['/beta/career', 'got the interview?', 'beta_career'],
  ['/beta/dating', 'first date. third outfit change?', 'beta_dating'],
]) {
  test(`${path} keeps its poster landing and links to the text handoff`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.locator(`.halo-cta--${place}`)).toHaveAttribute('href', /^sms:\+18556762419[?&]body=/)
    await expect(page.locator('form, input, textarea')).toHaveCount(0)
  })
}
