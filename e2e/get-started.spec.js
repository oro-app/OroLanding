import { test as base, expect } from './fixtures.js'

const draft = { name: 'Test Oronaut', birthday: '1998/01/02', country: 'CA', province: 'ON', hear: ['a friend'], hearOther: '', phone: '(416) 555-0123', phoneCountry: 'CA' }
const inviteError = { status: 403, json: { detail: { code: 'beta_invite_required', message: 'An approved beta invite is required' } } }
const test = base.extend({
  api: async ({ page }, use) => {
    const api = { start: { status: 200, json: { status: 'otp_sent' } }, verify: { status: 200, json: { status: 'verified' } }, requests: [] }
    await page.route('**/onboarding/**', async (route) => {
      const action = new URL(route.request().url()).pathname.split('/').pop()
      api.requests.push({ action, body: route.request().postDataJSON() })
      const response = api[action]
      if (response === 'abort') await route.abort()
      else await route.fulfill(response || { status: 500, json: {} })
    })
    await use(api)
  },
})

async function phoneStep(page, answers = draft) {
  await page.goto('/get-started')
  await page.evaluate((answers) => localStorage.setItem('oro_get_started_responses', JSON.stringify(answers)), answers)
  await page.reload()
  await continueToPhone(page)
}

async function continueToPhone(page) {
  await page.getByRole('button', { name: 'Let’s get you settled' }).click()
  for (let step = 0; step < 4; step += 1) await page.getByRole('button', { name: 'Continue.', exact: true }).click()
  await expect(page.getByLabel('Phone number', { exact: true })).toBeVisible()
}

async function codeStep(page) {
  await phoneStep(page)
  await page.getByRole('button', { name: 'Send verification code.' }).click()
  await expect(page.getByRole('heading', { name: 'We just texted you.' })).toBeVisible()
}

async function verify(page, code = '123456') {
  await page.getByLabel('Verification code', { exact: true }).fill(code)
  await page.getByRole('button', { name: 'Verify.', exact: true }).click()
}

test('approved setup completes by keyboard with oro-kit controls and clears the draft', async ({ page, api }) => {
  await page.goto('/get-started')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await page.getByRole('button', { name: 'Let’s get you settled' }).click()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('First name')).toBeFocused()
  await page.keyboard.type('Test Oronaut')
  await page.keyboard.press('Enter')
  await page.getByLabel('Birth year', { exact: true }).fill('1998')
  await page.getByLabel('Birth month', { exact: true }).fill('01')
  await page.getByLabel('Birth day', { exact: true }).fill('02')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Canada', exact: true }).click()
  const region = page.getByRole('combobox', { name: 'Province or territory' })
  await region.focus()
  await page.keyboard.press('Enter')
  for (let i = 0; i < 8; i += 1) await page.keyboard.press('ArrowDown')
  await expect(region).toHaveAttribute('aria-activedescendant', /-8$/)
  await page.keyboard.press('Enter')
  await expect(region).toContainText('Ontario')
  await page.getByRole('button', { name: 'Continue.', exact: true }).click()
  await page.getByRole('button', { name: 'A friend', exact: true }).click()
  await page.getByRole('button', { name: 'Continue.', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Country code: Canada (+1)', exact: true })).toBeVisible()
  await page.getByLabel('Phone number', { exact: true }).fill('(416) 555-0123')
  await page.getByRole('button', { name: 'Send verification code.' }).click()
  await verify(page)
  await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeFocused()
  await expect(page.getByText('Your beta setup is complete. Send Oro your first text to get started.')).toBeVisible()
  await expect(page.getByText(/oro just texted you|check your phone|already signed up/i)).toHaveCount(0)
  const separator = await page.evaluate(() => /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?')
  await expect(page.getByRole('link', { name: 'Start texting Oro', exact: true })).toHaveAttribute('href', `sms:+18556762419${separator}body=${encodeURIComponent('Hey Oro! Your newest Oronaut has landed 🚀')}`)
  await expect(page.getByText('On your computer? Text +1 (855) 676-2419 from your phone.')).toBeVisible()
  expect(api.requests.map((request) => request.action)).toEqual(['start', 'verify'])
  expect(api.requests[0].body).toMatchObject({ country: 'CA', state: 'ON', birthday: '1998-01-02', phone: '+14165550123' })
  expect(api.requests[1].body.phone).toBe('+14165550123')
  expect(await page.evaluate(() => localStorage.getItem('oro_get_started_responses'))).toBeNull()
})

for (const [country, phone, expected] of [
  ['PK', '0301 2345678', '+923012345678'],
  ['GB', '07911 123456', '+447911123456'],
  ['IT', '02 3661 8300', '+390236618300'],
]) {
  test(`the ${country} dropdown normalizes local numbers for start, resend, and verify`, async ({ page, api }) => {
    await page.clock.install()
    await phoneStep(page)
    await page.getByRole('button', { name: /^Country code:/ }).click()
    await page.getByRole('textbox', { name: 'Search countries' }).fill(country)
    const label = { PK: 'Pakistan (+92)', GB: 'United Kingdom (+44)', IT: 'Italy (+39)' }[country]
    await page.getByRole('button', { name: label, exact: true }).click()
    await page.getByLabel('Phone number', { exact: true }).fill(phone)
    await page.getByRole('button', { name: 'Send verification code.' }).click()
    await expect(page.getByLabel('Verification code', { exact: true })).toBeVisible()
    expect((await page.getByText(/Enter the code we sent to/).innerText()).replace(/[^\d+]/g, '')).toBe(expected)
    await page.clock.runFor(61000)
    await page.getByRole('button', { name: 'Resend code', exact: true }).click()
    await expect(page.getByRole('status')).toContainText('New code sent.')
    await verify(page)
    await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible()
    expect(api.requests.map(({ action, body }) => [action, body.phone])).toEqual([
      ['start', expected], ['start', expected], ['verify', expected],
    ])
    expect(api.requests[0].body).toMatchObject({ country: 'CA', state: 'ON' })
  })
}

test('pasted international numbers update the dropdown and survive a reload', async ({ page, api }) => {
  await phoneStep(page)
  await page.getByLabel('Phone number', { exact: true }).fill('+92 301 2345678')
  await expect(page.getByRole('button', { name: 'Country code: Pakistan (+92)', exact: true })).toBeVisible()
  await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue('0301 2345678')
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('oro_get_started_responses')))
  expect(saved).toMatchObject({ phoneCountry: 'PK', phone: '0301 2345678', country: 'CA' })
  await page.reload()
  await continueToPhone(page)
  await expect(page.getByRole('button', { name: 'Country code: Pakistan (+92)', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Send verification code.' }).click()
  await verify(page)
  await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible()
  expect(api.requests.map(({ body }) => body.phone)).toEqual(['+923012345678', '+923012345678'])
})

test('older drafts with full international numbers are split into the country and national number', async ({ page, api }) => {
  const { phoneCountry, ...olderDraft } = draft
  await phoneStep(page, { ...olderDraft, phone: '+1 (416) 555-0123' })
  await expect(page.getByRole('button', { name: 'Country code: Canada (+1)', exact: true })).toBeVisible()
  await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue('(416) 555-0123')
  await page.getByRole('button', { name: 'Send verification code.' }).click()
  await expect(page.getByLabel('Verification code', { exact: true })).toBeVisible()
  expect(api.requests[0].body.phone).toBe('+14165550123')
})

test('the country picker searches and works by keyboard on a narrow screen', async ({ page, api }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await phoneStep(page)
  const trigger = page.getByRole('button', { name: /^Country code:/ })
  await trigger.focus()
  await page.keyboard.press('Enter')
  const search = page.getByRole('textbox', { name: 'Search countries' })
  await expect(search).toBeFocused()
  await search.fill('does not exist')
  await expect(page.getByRole('status')).toHaveText('No countries found.')
  await search.fill('+92')
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('button', { name: 'Pakistan (+92)', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(trigger).toHaveAccessibleName('Country code: Pakistan (+92)')
  await expect(trigger).toBeFocused()
  await page.keyboard.press('Enter')
  await search.fill('Canada')
  await page.keyboard.press('Escape')
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAccessibleName('Country code: Pakistan (+92)')
  await trigger.click()
  await expect(search).toHaveValue('')
  const bounds = await page.getByRole('dialog', { name: 'Choose a country code' }).boundingBox()
  expect(bounds.x).toBeGreaterThanOrEqual(0)
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320)
  await page.getByLabel('Phone number', { exact: true }).click()
  await expect(search).toHaveCount(0)
  expect(api.requests).toEqual([])
})

test('invalid phone numbers and extensions show a local error without requesting an OTP', async ({ page, api }) => {
  await phoneStep(page)
  for (const phone of ['123', 'not a phone number', '416 555 0123 ext. 5']) {
    await page.getByLabel('Phone number', { exact: true }).fill(phone)
    await page.getByRole('button', { name: 'Send verification code.' }).click()
    await expect(page.getByRole('alert')).toContainText('Enter a valid phone number')
  }
  expect(api.requests).toEqual([])
  await page.getByLabel('Phone number', { exact: true }).fill('416 555 0123')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

for (const phase of ['start', 'verify']) {
  test(`an unapproved or revoked invitation is explained at ${phase}`, async ({ page, api }) => {
    api[phase] = inviteError
    if (phase === 'start') {
      await phoneStep(page)
      await page.getByRole('button', { name: 'Send verification code.' }).click()
    } else {
      await codeStep(page)
      await verify(page)
    }
    await expect(page.getByRole('heading', { name: 'An invitation comes first.' })).toBeFocused()
    await expect(page.getByRole('link', { name: 'Request an invite' })).toHaveAttribute('href', '/beta')
    await expect(page.getByRole('link', { name: 'Email us for help' })).toHaveAttribute('href', 'mailto:sunny@buildingoro.ca')
    await page.getByRole('button', { name: 'Use a different number' }).click()
    await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue(draft.phone)
  })
}

test('an incorrect or expired code stays recoverable without completing setup', async ({ page, api }) => {
  api.verify = { status: 400, json: { detail: 'Invalid or expired code' } }
  await codeStep(page)
  await verify(page, '000000')
  await expect(page.getByRole('alert')).toContainText('didn’t match or has expired')
  await expect(page.getByLabel('Verification code', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  api.verify = { status: 200, json: { status: 'verified' } }
  await verify(page)
  await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible()
})

test('an existing code is usable during the resend cooldown', async ({ page, api }) => {
  api.start = { status: 429, json: { code: 'otp_cooldown', detail: 'Code already sent — try again in a minute' } }
  await codeStep(page)
  await expect(page.getByRole('status')).toContainText('A code was already sent')
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled()
  await verify(page)
  await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible()
})

for (const phase of ['start', 'verify']) {
  test(`rate limiting at ${phase} respects Retry-After`, async ({ page, api }) => {
    await page.clock.install()
    api[phase] = { status: 429, headers: { 'Retry-After': '5', 'Access-Control-Expose-Headers': 'Retry-After' }, json: { detail: 'Too many requests' } }
    if (phase === 'start') {
      await phoneStep(page)
      await page.getByRole('button', { name: 'Send verification code.' }).click()
    } else {
      await codeStep(page)
      await verify(page)
    }
    await expect(page.getByRole('alert')).toContainText('Too many')
    await expect(page.getByRole('button', { name: phase === 'start' ? /Send code in/ : /Try again in/ })).toBeDisabled()
    await page.clock.runFor(5100)
    await expect(page.getByRole('button', { name: phase === 'start' ? 'Send verification code.' : 'Verify.', exact: true })).toBeEnabled()
  })
}

const recoveryCases = [
  ['expired setup', 410, { detail: 'Signup expired — start over from the form' }, 'Let’s get a fresh code.'],
  ['account-binding conflict', 409, { detail: 'This invite is linked to another account; contact sunny@buildingoro.ca' }, 'Let’s check your account.'],
  ['failed database save', 503, { detail: 'Unable to finish beta setup; request a new code and try again' }, 'We couldn’t finish your setup.'],
  ['closed setup', 503, { detail: 'Beta setup is not open yet' }, 'Beta setup isn’t open yet.'],
  ['malformed success', 200, {}, 'We couldn’t finish your setup.'],
]
for (const [scenario, status, json, heading] of recoveryCases) {
  test(`${scenario} never shows success and preserves answers`, async ({ page, api }) => {
    api.verify = { status, json }
    await codeStep(page)
    await verify(page)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeFocused()
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('oro_get_started_responses')))).toEqual(draft)
    await page.getByRole('button', { name: /Back to phone verification|Use a different number/ }).click()
    await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue(draft.phone)
  })
}

for (const detail of ['Beta setup is not open yet', 'Unable to check beta access; try again']) {
  test(`start handles unavailable access: ${detail}`, async ({ page, api }) => {
    api.start = { status: 503, json: { detail } }
    await phoneStep(page)
    await page.getByRole('button', { name: 'Send verification code.' }).click()
    await expect(page.getByRole('heading', { name: /Beta setup isn’t open yet|Setup is temporarily unavailable/ })).toBeVisible()
    expect(api.requests).toHaveLength(1)
  })
}

for (const response of [{ status: 200, json: {} }, { status: 502, contentType: 'text/html', body: '<h1>Gateway error</h1>' }, 'abort']) {
  test(`start can retry after ${typeof response === 'string' ? response : response.status}`, async ({ page, api }) => {
    api.start = response
    await phoneStep(page)
    await page.getByRole('button', { name: 'Send verification code.' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByLabel('Phone number', { exact: true })).toHaveValue(draft.phone)
    api.start = { status: 200, json: { status: 'otp_sent' } }
    await page.getByRole('button', { name: 'Send verification code.' }).click()
    await expect(page.getByLabel('Verification code', { exact: true })).toBeVisible()
  })
}

test('a lost verification response offers a fresh-code recovery', async ({ page, api }) => {
  api.verify = 'abort'
  await codeStep(page)
  await verify(page)
  await expect(page.getByRole('heading', { name: 'We lost the connection.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to phone verification' })).toBeEnabled()
})

test('private setup fields never enter analytics even with prior consent', async ({ page, api }) => {
  const analyticsRequests = []
  page.on('request', (request) => {
    if (/google-analytics|googletagmanager|posthog/.test(request.url())) analyticsRequests.push(request.url())
  })
  await page.addInitScript(() => {
    localStorage.setItem('oro_cookie_consent', 'accepted')
    window.dataLayer = []
    window.gtag = (...args) => window.dataLayer.push(args)
  })
  await codeStep(page)
  await verify(page)
  await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible()
  expect(analyticsRequests).toEqual([])
  expect(await page.evaluate(() => window.dataLayer)).toEqual([])
  expect(api.requests).toHaveLength(2)
})

for (const width of [320, 390]) {
  test(`mobile setup fits at ${width}px with reduced motion`, async ({ page, api }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await codeStep(page)
    await expect(page.getByLabel('Verification code', { exact: true })).toBeVisible()
    expect(await page.locator('.gs-screen').evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await verify(page)
    await expect(page.getByRole('heading', { name: 'You’re all set.' })).toBeVisible()
  })
}

for (const [device, userAgent, separator] of [
  ['iPhone', 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', '&'],
  ['Android', 'Mozilla/5.0 (Linux; Android 15; Pixel 9)', '?'],
]) {
  test(`texting link prefills the welcome message on ${device}`, async ({ page, api }) => {
    await page.addInitScript((value) => Object.defineProperty(navigator, 'userAgent', { get: () => value }), userAgent)
    await codeStep(page)
    await verify(page)
    await expect(page.getByRole('link', { name: 'Start texting Oro', exact: true })).toHaveAttribute(
      'href', `sms:+18556762419${separator}body=${encodeURIComponent('Hey Oro! Your newest Oronaut has landed 🚀')}`,
    )
  })
}
