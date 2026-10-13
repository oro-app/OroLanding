import { test, expect } from './fixtures.js'

const token = 'synthetic.personal.token'
const offer = { amount: 2500, currency: 'usd', interval: 'month', first_month_amount: 1250,
  first_month_discount_percent: 50, launch_offer_ends_at: '2026-10-14T04:00:00Z' }
const native = { status: 'checkout', offer, client_secret: 'cs_test_native_secret', session_id: 'cs_test_native' }

async function mockStripe(page) {
  await page.addInitScript(() => {
    window.Stripe = () => ({
      elements() {}, createToken() {}, createPaymentMethod() {}, confirmCardPayment() {},
      initCheckoutElementsSdk() {
        const actions = {
          getSession: () => ({}),
          confirm: async () => {
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
