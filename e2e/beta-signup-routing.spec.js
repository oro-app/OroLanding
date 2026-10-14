import { test, expect } from './fixtures.js'

test('invite landing preserves the invitation through the phone entry', async ({ page }) => {
  const referralCode = 'b'.repeat(64)
  await page.goto(`/invite?ref=${referralCode}&src=ig-sunny&step=phone`)
  const cta = page.locator('.beta-welcome .halo-cta--beta_general')
  const inviteUrl = `${new URL(page.url()).origin}/invite?ref=${referralCode}`
  await expect(cta).toHaveAttribute('href', `/get-started?invite=${encodeURIComponent(inviteUrl)}`)
  await cta.click()
  await expect(page.getByLabel('Phone number')).toBeVisible()
})

for (const [path, title, place] of [
  ['/beta', 'heard you were looking for my number.', 'beta_general'],
  ['/beta/career', 'got the interview?', 'beta_career'],
  ['/beta/dating', 'first date. third outfit change?', 'beta_dating'],
]) {
  test(`${path} keeps its poster landing and links to phone entry`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(page.locator(`.halo-cta--${place}`)).toHaveAttribute('href', '/get-started')
    await expect(page.locator('form, input, textarea')).toHaveCount(0)
  })
}
