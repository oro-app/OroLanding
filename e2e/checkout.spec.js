import { test, expect } from './fixtures.js'

const token = 'synthetic.personal.token'
const offer = { amount: 2500, currency: 'usd', interval: 'month', first_month_amount: 1250,
  first_month_discount_percent: 50, launch_offer_ends_at: '2026-10-14T04:00:00Z' }
const native = { status: 'checkout', offer, client_secret: 'cs_test_native_secret', session_id: 'cs_test_native', publishable_key: 'pk_test_synthetic' }

async function mockStripe(page) {
  await page.addInitScript(() => {
    window.Stripe = () => ({
      elements() {}, createToken() {}, createPaymentMethod() {}, confirmCardPayment() {},
      initCheckoutElementsSdk() {
        const actions = {
          getSession: () => ({ total: { total: { amount: window.checkoutTotalAmount || '$12.50', minorUnitsAmount: 1250 } } }),
          confirm: async (options) => {
            window.checkoutConfirmOptions = options;
            window.checkoutConfirms = (window.checkoutConfirms || 0) + 1
            return window.checkoutDecline
              ? { type: 'error', error: { message: 'Your card was declined.' } }
              : { type: 'success', session: {} }
          },
        }
        return {
          on() {}, loadActions: async () => ({ type: 'success', actions }),
          createPaymentElement() {
            return { on() {}, off() {}, update() {}, destroy() {}, unmount() {},
              mount(node) { node.textContent = 'Secure card details (mock Stripe)' } }
          },
        }
      },
    })
  })
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-13T16:00:00Z') })
  await mockStripe(page)
})

test('personal checkout keeps credentials private and requires billing consent', async ({ page }) => {
  const requests = []
  page.on('request', request => requests.push(request.url()))
  await page.route('**/api/checkout?*', route => {
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`)
    return route.fulfill({ json: native })
  })
  await page.goto(`/checkout#token=${token}`)
  await expect(page.locator('.checkout-price')).toHaveText('$12.50$25')
  await expect(page.getByText('50% off your first month')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Meet my personal stylist' })).toBeDisabled()
  await expect(page).toHaveURL(/\/checkout$/)
  expect(requests.some(url => url.includes(token))).toBe(false)
  await page.reload()
  await expect(page.getByLabel('Email')).toBeVisible()
  await page.getByLabel('Email').fill('synthetic@example.com')
  await page.getByRole('checkbox').check()
  await expect(page.getByRole('button', { name: 'Meet my personal stylist' })).toBeEnabled()
})

test('a decline keeps checkout available and never claims paid access', async ({ page }) => {
  await page.route('**/api/checkout?*', route => route.fulfill({ json: native }))
  await page.goto(`/checkout#token=${token}`)
  await page.getByLabel('Email').fill('synthetic@example.com')
  await page.getByRole('checkbox').check()
  await page.evaluate(() => { window.checkoutDecline = true })
  await page.getByRole('button', { name: 'Meet my personal stylist' }).click()
  await expect(page.getByRole('alert')).toHaveText('Your card was declined.')
  await expect(page.getByRole('heading', { name: 'You’re in.' })).toHaveCount(0)
})

test('confirmation waits for the existing activation flow before showing success', async ({ page }) => {
  let phase = 'checkout'
  await page.route('**/api/checkout?*', route => route.fulfill({ json: phase === 'checkout'
    ? native : { ...native, status: phase, paid: true } }))
  await page.goto(`/checkout#token=${token}`)
  await page.getByLabel('Email').fill('synthetic@example.com')
  await page.getByRole('checkbox').check()
  phase = 'payment_pending'
  await page.getByRole('button', { name: 'Meet my personal stylist' }).click()
  await expect(page.getByRole('heading', { name: 'Getting you ready.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'You’re in.' })).toHaveCount(0)
  phase = 'ready'
  await page.clock.runFor(3100)
  await expect(page.getByRole('heading', { name: 'You’re in.' })).toBeVisible()
})

test('midnight reloads the server quote and removes the launch promotion', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-14T03:59:58Z'))
  let expired = false
  await page.route('**/api/checkout?*', route => route.fulfill({ json: expired ? { ...native,
    session_id: 'cs_test_regular', client_secret: 'cs_test_regular_secret',
    offer: { ...offer, first_month_amount: 2500, first_month_discount_percent: 0, launch_offer_ends_at: null },
  } : native }))
  await page.goto(`/checkout#token=${token}`)
  await expect(page.getByRole('timer')).toContainText('02')
  expired = true
  await page.evaluate(() => { window.checkoutTotalAmount = '$25' })
  await page.clock.setFixedTime(new Date('2026-10-14T04:00:01Z'))
  await page.clock.runFor(1000)
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  await expect(page.getByRole('timer')).toHaveCount(0)
  await expect(page.getByText('50% off your first month')).toHaveCount(0)
})

test('expired personal links offer recovery and never load payment', async ({ page }) => {
  await page.route('**/api/checkout?*', route => route.fulfill({ status: 401, json: {} }))
  await page.goto(`/checkout#token=${token}`)
  await expect(page.getByRole('alert')).toHaveText('Text Oro for a fresh checkout link.')
  await expect(page.getByLabel('Email')).toHaveCount(0)
})

test('checkout fits a narrow phone and keeps its typography on the Oro tokens', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 1000 })
  await page.route('**/api/checkout?*', route => route.fulfill({ json: native }))
  await page.goto(`/checkout#token=${token}`)
  await expect(page.getByLabel('Email')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const styles = await page.locator('.checkout-story h1').evaluate(node => {
    const style = getComputedStyle(node)
    const root = getComputedStyle(document.documentElement)
    return { size: style.fontSize, expected: parseFloat(root.getPropertyValue('--oro-type-title-size')) * 16 }
  })
  expect(parseFloat(styles.size)).toBe(styles.expected)
})


const entryToken = `header.${Buffer.from(JSON.stringify({ aud: 'public-checkout' })).toString('base64url')}.signature`

test('checkout retains same-origin preview access when starting and resuming payment', async ({ page }, testInfo) => {
  await page.context().addCookies([{ name: 'synthetic_preview_access', value: 'granted', url: testInfo.project.use.baseURL }])
  const operations = []
  await page.route('**/api/checkout?*', async route => {
    const headers = await route.request().allHeaders()
    if (!headers.cookie?.includes('synthetic_preview_access=granted')) {
      return route.fulfill({ status: 302, headers: { location: '/synthetic-preview-login' } })
    }
    operations.push(new URL(route.request().url()).searchParams.get('operation'))
    return route.fulfill({ json: { ...native, token: entryToken, collect_phone: true } })
  })
  await page.goto('/checkout')
  await expect(page.getByLabel('Email')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Email')).toBeVisible()
  expect(operations.filter(operation => operation === 'entry')).toHaveLength(1)
  expect(operations).toContain('entry-status')
  expect(operations.slice(1).every(operation => operation === 'entry-status')).toBe(true)
})

test('public checkout requires a number on the payment screen and submits it to Stripe', async ({ page }) => {
  let phase = 'checkout'
  let entries = 0
  const notices = []
  await page.route('**/api/checkout?*', route => {
    const operation = new URL(route.request().url()).searchParams.get('operation')
    if (operation === 'entry') {
      entries += 1
      expect(route.request().postData()).toBeNull()
      return route.fulfill({ json: { ...native, token: entryToken, collect_phone: true } })
    }
    expect(route.request().headers().authorization).toBe(`Bearer ${entryToken}`)
    if (operation === 'entry-accept') {
      notices.push(route.request().postDataJSON())
      return route.fulfill({ json: { offer, status: 'checkout_ready' } })
    }
    return route.fulfill({ json: { ...native, collect_phone: true, status: phase, paid: phase !== 'checkout' } })
  })
  await page.goto('/checkout')
  await expect(page.getByText('Due today: $12.50')).toBeVisible()
  await page.getByLabel('Email').fill('synthetic@example.com')
  await expect(page.getByLabel('Phone number for texting Oro')).toHaveAttribute('required', '')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Meet my personal stylist' }).click()
  expect(await page.evaluate(() => window.checkoutConfirms || 0)).toBe(0)
  await page.getByLabel('Phone number for texting Oro').fill('123')
  await page.getByRole('button', { name: 'Meet my personal stylist' }).click()
  await expect(page.getByRole('alert')).toHaveText('Enter a valid phone number for texting Oro.')
  await page.getByLabel('Phone number for texting Oro').fill('(416) 555-0123')
  phase = 'ready'
  await page.getByRole('button', { name: 'Meet my personal stylist' }).click()
  await expect(page.getByRole('heading', { name: 'You’re in.' })).toBeVisible()
  expect(notices).toEqual([{ phone: '+14165550123', terms_accepted: true, texting_consent: true }])
  expect(await page.evaluate(() => window.checkoutConfirmOptions.phoneNumber)).toBe('+14165550123')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'You’re in.' })).toBeVisible()
  expect(entries).toBe(1)
})

test('an existing subscriber returns to text before Stripe confirmation', async ({ page }) => {
  await page.route('**/api/checkout?*', route => {
    const operation = new URL(route.request().url()).searchParams.get('operation')
    return route.fulfill({ json: operation === 'entry-accept' ? { offer, status: 'continue_in_text' }
      : { ...native, token: entryToken, collect_phone: true } })
  })
  await page.goto('/checkout')
  await page.getByLabel('Email').fill('synthetic@example.com')
  await page.getByLabel('Phone number for texting Oro').fill('4165550123')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Meet my personal stylist' }).click()
  await expect(page.getByRole('link', { name: 'Text Oro ↗' })).toBeVisible()
  expect(await page.evaluate(() => window.checkoutConfirms || 0)).toBe(0)
})
