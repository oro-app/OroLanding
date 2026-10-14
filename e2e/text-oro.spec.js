import { test, expect } from './fixtures.js'

const token = 'synthetic.phone.token'
const offer = { amount: 2500, currency: 'usd', interval: 'month', first_month_amount: 2500, first_month_discount_percent: 0 }

for (const width of [320, 1440]) {
  test(`phone entry at ${width}px goes straight to existing checkout`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const bodies = []
    await page.route('**/api/checkout?operation=phone', route => {
      bodies.push(route.request().postDataJSON())
      return route.fulfill({ json: { status: 'checkout_ready', token, offer } })
    })
    await page.route('**/api/checkout?operation=status', route => {
      expect(route.request().headers().authorization).toBe(`Bearer ${token}`)
      return route.fulfill({ json: { status: 'checkout', offer, checkout_url: 'https://checkout.stripe.com/test' } })
    })
    await page.goto('/get-started')
    await expect(page.locator('input')).toHaveCount(1)
    await expect(page.getByRole('checkbox')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    await page.getByLabel('Phone number').fill('(416) 555-0123')
    await page.getByRole('button', { name: 'meet my stylist' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('.checkout-price')).toHaveText('$25')
    expect(bodies).toEqual([{ phone: '+14165550123', terms_accepted: true, texting_consent: true }])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.goto('/get-started')
    await page.getByLabel('Phone number').fill('4165550123')
    await page.getByRole('button', { name: 'meet my stylist' }).click()
    await expect(page).toHaveURL(/\/checkout$/)
    await expect(page.locator('.checkout-price')).toHaveText('$25')
    expect(bodies).toHaveLength(1)
  })
}

test('invalid number stays on entry and sends no signup request', async ({ page }) => {
  const writes = []
  page.on('request', request => { if (request.method() === 'POST') writes.push(request.url()) })
  await page.goto('/getstarted')
  await page.getByLabel('Phone number').fill('123')
  await page.getByRole('button', { name: 'meet my stylist' }).click()
  await expect(page.getByRole('alert')).toContainText('Enter a valid phone number')
  expect(writes).toEqual([])
})

test('existing checkout keeps its text recovery and preserves the invitation', async ({ page }) => {
  const invite = `${process.env.E2E_BASE_URL}/invite?ref=${'b'.repeat(64)}`
  await page.route('**/api/checkout?operation=phone', route => route.fulfill({ json: { status: 'continue_in_text', offer } }))
  await page.goto(`/get-started?invite=${encodeURIComponent(invite)}`)
  await page.getByLabel('Phone number').fill('4165550123')
  await page.getByRole('button', { name: 'meet my stylist' }).click()
  await expect(page.getByRole('link', { name: 'text oro' })).toHaveAttribute('href', new RegExp(encodeURIComponent(invite)))
  await expect(page.locator('form')).toHaveCount(0)
})

test('a signup failure preserves the number for retry', async ({ page }) => {
  await page.route('**/api/checkout?operation=phone', route => route.fulfill({ status: 503, json: {} }))
  await page.goto('/get-started')
  await page.getByLabel('Phone number').fill('4165550123')
  await page.getByRole('button', { name: 'meet my stylist' }).click()
  await expect(page.getByRole('alert')).toContainText('Please try again')
  await expect(page.getByLabel('Phone number')).toHaveValue('4165550123')
})
