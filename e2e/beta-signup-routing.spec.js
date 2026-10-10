import { test, expect } from './fixtures.js'

test('invite landing sends people to Messages or QR without web onboarding', async ({ page }) => {
  const referralCode = 'b'.repeat(64)
  const writes = []
  page.on('request', (request) => {
    if (request.method() !== 'GET') writes.push(request.url())
  })

  await page.goto(`/invite?ref=${referralCode}&src=ig-sunny&step=phone`)
  await expect(page).toHaveURL(new RegExp(`/invite\\?ref=${referralCode}&src=ig-sunny$`))
  await expect(page.locator('form, input, textarea')).toHaveCount(0)
  const cta = page.locator('.beta-welcome .halo-cta--beta_general')
  const inviteUrl = `${new URL(page.url()).origin}/invite?ref=${referralCode}`
  await expect(cta).toHaveAttribute('href', /^sms:/)
  await expect(cta).toHaveAttribute('href', new RegExp(encodeURIComponent(inviteUrl)))
  await cta.click()
  await expect(page.getByRole('dialog', { name: "get oro's number" })).toBeVisible()
  await expect(page.locator('.text-oro-number')).toHaveAttribute('href', new RegExp(encodeURIComponent(inviteUrl)))
  expect(writes).toEqual([])
})

for (const [path, title, place] of [
  ['/beta', 'heard you were looking for my number.', 'beta_general'],
  ['/beta/career', 'got the interview?', 'beta_career'],
  ['/beta/dating', 'first date. third outfit change?', 'beta_dating'],
]) {
  test(`${path} keeps its poster landing and direct text handoff`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.locator(`.halo-cta--${place}`)).toHaveAttribute('href', /^sms:/)
    await expect(page.locator('form, input, textarea')).toHaveCount(0)
  })
}
