import { test, expect } from './fixtures.js'
import { fillRequired } from './beta-helpers.js'

const requestId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }) })

async function openForm(page, respond) {
  await page.route('**/api/beta-request', (route) => route.request().method() === 'GET'
    ? route.fulfill({ json: { enabled: true } }) : respond(route))
  await page.goto('/beta#request')
  await expect(page.locator('.beta-draft-bar')).toHaveCount(0)
  await fillRequired(page)
}

test('confirmed save shows a receipt, locks duplicate clicks and preserves independent consents', async ({ page }) => {
  test.setTimeout(60000)
  let body, release, calls = 0
  const held = new Promise((resolve) => { release = resolve })
  await openForm(page, async (route) => {
    body = route.request().postDataJSON()
    calls++
    await held
    await route.fulfill({ json: { ok: true, request_id: requestId, submission_key: body.submission_key } })
  })
  await page.getByRole('checkbox', { name: /If I’m not invited/ }).uncheck()
  await page.getByRole('button', { name: 'Request an invite', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saving your request…' })).toBeDisabled()
  await expect(page.getByRole('checkbox', { name: /I’d like to receive marketing/ })).toBeDisabled()
  await expect(page.getByRole('button', { name: '← Back', exact: true })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Request received :)' })).toHaveCount(0)
  release()
  await expect(page.getByRole('heading', { name: 'Request received :)' })).toBeVisible()
  await expect(page.getByText(`Request reference: ${requestId}`)).toBeVisible()
  await expect(page.getByText('Confirmation preview · No request has been saved')).toHaveCount(0)
  expect(calls).toBe(1)
  expect(body.answers).toMatchObject({ phone: '+14165550123', email: 'beta-test@example.com', futureBeta: false, marketing: true })
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))).not.toContain('beta-test@example.com')
})

test('a lost response keeps answers and retries the same request key', async ({ page }) => {
  test.setTimeout(60000)
  const bodies = []
  await openForm(page, async (route) => {
    bodies.push(route.request().postDataJSON())
    if (bodies.length === 1) await route.abort('failed')
    else await route.fulfill({ json: { ok: true, request_id: requestId, submission_key: bodies[1].submission_key } })
  })
  await page.getByRole('button', { name: 'Request an invite', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('We couldn’t confirm your request.')
  await expect(page.getByRole('heading', { name: 'Request received :)' })).toHaveCount(0)
  await page.getByRole('button', { name: '← Back', exact: true }).click()
  await expect(page.getByRole('radio', { name: 'Website', exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Request an invite', exact: true }).click()
  await expect(page.getByText(`Request reference: ${requestId}`)).toBeVisible()
  expect(bodies[1]).toEqual(bodies[0])
})

test('only an explicit updated request creates a new key after a conflict', async ({ page }) => {
  test.setTimeout(60000)
  const keys = []
  await openForm(page, async (route) => {
    const body = route.request().postDataJSON()
    keys.push(body.submission_key)
    await route.fulfill(keys.length === 1
      ? { status: 409, json: { code: 'submission_conflict' } }
      : { json: { ok: true, request_id: requestId, submission_key: body.submission_key } })
  })
  await page.getByRole('button', { name: 'Request an invite', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Your earlier answers were already saved.')
  expect(keys).toHaveLength(1)
  await page.getByRole('button', { name: 'Send updated request', exact: true }).click()
  await expect(page.getByText(`Request reference: ${requestId}`)).toBeVisible()
  expect(keys[1]).not.toBe(keys[0])
})

test('rate limiting, paused intake and a malformed receipt never show confirmation', async ({ page }) => {
  test.setTimeout(60000)
  const replies = [
    { status: 429, json: { code: 'rate_limited' } },
    { status: 503, json: { code: 'signup_closed' } },
    { json: { ok: true, request_id: requestId, submission_key: 'wrong' } },
  ]
  await openForm(page, (route) => route.fulfill(replies.shift()))
  for (const message of ['Please wait a minute', 'Invite requests are paused.', 'We couldn’t confirm your request.']) {
    await page.getByRole('button', { name: 'Request an invite', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText(message)
    await expect(page.getByRole('heading', { name: 'Request received :)' })).toHaveCount(0)
  }
})
