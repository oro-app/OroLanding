import { test, expect } from './fixtures.js'

const offer = { amount: 2000, currency: 'usd', interval: 'month', first_month_amount: 2000, first_month_discount_percent: 0 }
const token = `header.${Buffer.from(JSON.stringify({ aud: 'public-checkout' })).toString('base64url')}.signature`

for (const path of ['/getstarted', '/get-started', '/checkout']) {
  test(`${path} opens checkout without a number step`, async ({ page }) => {
    await page.route('**/api/checkout?operation=entry', route => {
      expect(route.request().postData()).toBeNull()
      return route.fulfill({ json: { status: 'checkout', offer, token, collect_phone: true, checkout_url: 'https://checkout.stripe.com/test' } })
    })
    await page.goto(path)
    await expect(page.locator('.checkout-price')).toHaveText('$20')
    await expect(page.getByRole('link', { name: 'Meet my personal stylist' })).toBeVisible()
    await expect(page.locator('.text-oro-form')).toHaveCount(0)
  })
}
