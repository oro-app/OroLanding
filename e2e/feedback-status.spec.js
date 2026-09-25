import { test, expect } from './fixtures'

const token = 'synthetic-invitation'
const id = '11111111-1111-4111-8111-111111111111'
const endpoint = '**/agent2/beta-feedback/**'
const session = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('oro_feedback_session')))
const form = (status = 'open') => ({
  invitation_id: id, survey_kind: 'daily', survey_version: 1, status,
  context: { beta_label: 'Oro beta', local_date: '2026-09-24', timezone: 'America/Toronto' },
  expires_at: '2020-01-01T00:00:00Z', submission_id: status === 'open' ? null : id,
  questions: status === 'open' ? [{ id: 'D13', type: 'text', prompt: 'Your day', required: false, allow_comment: false, choices: [], show_if: [] }] : [],
  receipt: status === 'submitted' ? { submission_id: id, submitted_at: '2026-09-25T00:00:00Z' } : null,
})

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-25T00:00:00Z') })
  await page.clock.pauseAt(new Date('2026-09-25T00:01:00Z'))
})

test('open forms retain their original daily context on narrow screens', async ({ page }) => {
  await page.route(endpoint, (route) => route.fulfill({ json: form() }))
  await page.goto(`/feedback#token=${token}`)
  await expect(page.getByText('daily feedback · 2026-09-24 (America/Toronto)')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your day' })).toBeVisible()
  expect((await session(page)).token).toBe(token)
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('link', { name: 'Email us' })).toBeInViewport()
  }
})

test('saving waits for a receipt and completion survives skip-link navigation', async ({ page }) => {
  let calls = 0
  await page.route(endpoint, (route) => route.fulfill({ json: form(++calls === 1 ? 'saving' : 'submitted') }))
  await page.goto(`/feedback#token=${token}`)
  await expect(page.getByRole('status')).toContainText('still saving')
  await page.clock.runFor(14999)
  expect(calls).toBe(1)
  await page.clock.runFor(1)
  await expect(page.getByRole('status')).toContainText('Your feedback is saved')
  expect(await session(page)).toBeNull()
  await page.getByRole('link', { name: 'Skip to content' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
  await expect(page.getByRole('status')).toContainText('Your feedback is saved')
  await page.reload()
  await expect(page.getByRole('status')).toContainText('personal feedback link')
  expect(calls).toBe(2)
})

for (const [http, code, message, retained] of [
  [404, 'feedback_disabled', 'not available yet', true],
  [404, 'invalid_invitation', 'no longer valid', false],
  [410, 'invitation_expired', 'has expired', false],
  [401, 'missing_token', 'personal feedback link', false],
  [500, 'internal_failure', 'couldn’t check your invitation', true],
]) {
  test(`${code} shows safe guidance and handles the credential`, async ({ page }) => {
    await page.route(endpoint, (route) => route.fulfill({ status: http, json: { detail: { code, message: token } } }))
    await page.goto(`/feedback#token=${token}`)
    await expect(page.getByRole('status')).toContainText(message)
    expect(Boolean(await session(page))).toBe(retained)
    await expect(page.locator('body')).not.toContainText(token)
  })
}

test('refresh honors Retry-After before checking again', async ({ page }) => {
  let calls = 0
  await page.route(endpoint, (route) => route.fulfill(++calls === 1
    ? { status: 429, headers: { 'Retry-After': '90', 'Access-Control-Expose-Headers': 'Retry-After' }, json: { detail: { code: 'rate_limited' } } }
    : { json: form() }))
  await page.goto(`/feedback#token=${token}`)
  await expect(page.getByRole('status')).toContainText('Please wait')
  await page.reload()
  await expect(page.getByRole('status')).toContainText('Opening your invitation')
  await page.clock.runFor(89999)
  expect(calls).toBe(1)
  await page.clock.runFor(1)
  await expect(page.getByText('daily feedback · 2026-09-24 (America/Toronto)')).toBeVisible()
  expect(calls).toBe(2)
})

test('visibility and page-hide events pause checks and honor the remaining delay', async ({ page }) => {
  let calls = 0
  await page.route(endpoint, (route) => route.fulfill({ json: form(++calls === 1 ? 'saving' : 'submitted') }))
  await page.goto(`/feedback#token=${token}`)
  await expect(page.getByRole('status')).toContainText('still saving')
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(10000)
  expect(calls).toBe(1)
  await page.evaluate(() => {
    delete document.hidden
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await page.clock.runFor(4999)
  expect(calls).toBe(1)
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await page.clock.runFor(1000)
  expect(calls).toBe(1)
  await page.evaluate(() => window.dispatchEvent(new Event('pageshow')))
  await expect(page.getByRole('status')).toContainText('Your feedback is saved')
})

test('a late receipt cannot overwrite a replacement invitation', async ({ page }) => {
  let pending
  await page.route(endpoint, (route) => route.request().headers().authorization === `Bearer ${token}`
    ? (pending = route) : route.fulfill({ json: form() }))
  await page.goto(`/feedback#token=${token}`)
  await expect.poll(() => Boolean(pending)).toBe(true)
  await page.evaluate(() => { location.hash = 'token=replacement-invitation' })
  await expect(page.getByText('daily feedback · 2026-09-24 (America/Toronto)')).toBeVisible()
  await pending.fulfill({ json: form('submitted') })
  expect((await session(page)).token).toBe('replacement-invitation')
  await expect(page.getByRole('textbox', { name: 'Your day' })).toBeVisible()
})
