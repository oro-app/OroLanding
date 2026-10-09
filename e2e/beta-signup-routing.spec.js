import { test, expect } from './fixtures.js'

test('invite landing signs up in place and preserves Google Sheets attribution', async ({ page }) => {
  const referralCode = 'b'.repeat(64)
  let submission
  await page.route('**/api/beta-request', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { enabled: true } })
    submission = route.request().postDataJSON()
    return route.fulfill({ json: {
      ok: true,
      request_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      submission_key: submission.submission_key,
      referral_code: 'a'.repeat(64),
      signup_number: 1,
    } })
  })
  await page.route('**/api/beta-verify', (route) => route.fulfill({ json: route.request().postDataJSON().action === 'check'
    ? { ok: true, proof: 'test-proof' }
    : { ok: true } }))
  await page.route('**/api/beta-existing', (route) => route.fulfill({ json: { ok: true, found: false } }))

  await page.goto(`/invite?ref=${referralCode}&src=ig-sunny`)
  await page.getByRole('button', { name: 'want her number?', exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/invite\\?ref=${referralCode}&src=ig-sunny&step=phone$`))
  await page.getByLabel('phone number', { exact: true }).fill('4165550123')
  await page.getByRole('button', { name: 'send my code' }).click()
  await page.getByLabel('Verification code').fill('123456')
  await page.getByRole('button', { name: 'verify my number' }).click()
  await page.getByLabel('Your name', { exact: true }).fill('Jamie')
  await page.getByLabel('Email address', { exact: true }).fill('jamie@example.com')
  await page.getByRole('button', { name: 'Request an invite', exact: true }).click()

  await expect(page.getByRole('heading', { name: /you’re #1 in line to meet oro/i })).toBeVisible()
  expect(submission.referral_code).toBe(referralCode)
  expect(submission.campaign_source).toBe('ig-sunny')
  expect(submission.answers).toMatchObject({ phone: '+14165550123', name: 'Jamie', email: 'jamie@example.com' })
})
