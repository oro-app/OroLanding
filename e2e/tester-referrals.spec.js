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

for (const unavailable of [false, true]) {
  test(`signup lookup ${unavailable ? 'failure stops submission' : 'recognizes an approved tester'}`, async ({ page }) => {
    let writes = 0
    await page.route('**/api/beta-request', (route) => {
      if (route.request().method() === 'POST') writes++
      return route.fulfill({ json: { enabled: true } })
    })
    await page.route('**/api/beta-verify', (route) => route.fulfill({ json: { ok: true, proof: 'test-proof' } }))
    await page.route('**/api/beta-existing', (route) => route.fulfill({ status: unavailable ? 503 : 200, json: unavailable ? { code: 'temporarily_unavailable' } : { ok: true, found: true, tester: true, request_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', referral_code: 'a'.repeat(64), signup_number: 38, referred_signups: 1, referral_completed_date: '' } }))
    await page.goto('/beta?step=phone')
    await page.getByLabel('phone number', { exact: true }).fill('4165550123')
    await page.getByRole('button', { name: 'send my code' }).click()
    await page.getByLabel('Verification code').fill('123456')
    await page.getByRole('button', { name: 'verify my number' }).click()
    if (unavailable) await expect(page.getByText('Your phone is verified, but we couldn’t load your signup. Try again.')).toBeVisible()
    else {
      await expect(page.getByText('1 / 8 friends joined')).toBeVisible()
      await expect(page.getByText(/#38|0 of 3 friends/)).toHaveCount(0)
    }
    expect(writes).toBe(0)
  })
}
