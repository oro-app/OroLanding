import { test, expect } from './fixtures'

for (const count of [0, 7, 8, 9]) {
  test(`tester sees ${count} referrals and the correct reward state`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.route('**/api/beta-verify', (route) => route.fulfill({ json: { ok: true, proof: 'test-proof' } }))
    await page.route('**/api/beta-existing', (route) => route.fulfill({ json: { ok: true, found: true, tester: true, referral_code: 'a'.repeat(64), referred_signups: count } }))
    await page.goto('/tester/referrals')
    await page.getByLabel('phone number', { exact: true }).fill('4165550123')
    await page.getByRole('button', { name: 'send my code' }).click()
    await page.getByLabel('Verification code').fill('123456')
    await page.getByRole('button', { name: 'see my progress' }).click()
    await expect(page.getByText(`${count} / 8 friends joined`)).toBeVisible()
    await expect(page.getByLabel('Your invite link')).toHaveValue(/\/invite\?ref=a{64}$/)
    if (count >= 8) await expect(page.getByText(/Your hoodie \+ tote is unlocked!/)).toBeVisible()
    else await expect(page.getByText(`${8 - count} more ${8 - count === 1 ? 'friend' : 'friends'} to unlock your hoodie + tote.`)).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
}

test('unapproved signup cannot open tester reward progress', async ({ page }) => {
  await page.route('**/api/beta-verify', (route) => route.fulfill({ json: { ok: true, proof: 'test-proof' } }))
  await page.route('**/api/beta-existing', (route) => route.fulfill({ json: { ok: true, found: true, tester: false } }))
  await page.goto('/tester/referrals')
  await page.getByLabel('phone number', { exact: true }).fill('4165550123')
  await page.getByRole('button', { name: 'send my code' }).click()
  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: 'see my progress' }).click()
  await expect(page.getByText(/couldn’t find an approved tester/)).toBeVisible()
  await expect(page.getByLabel('Your invite link')).toHaveCount(0)
})
