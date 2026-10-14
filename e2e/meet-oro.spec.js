import { test, expect } from './fixtures.js'

const continueName = 'let oro help you get dressed'
const headingName = 'your closet has possibilities.'
const demoPath = '/demos/oro-onboarding-demo.mp4'
const offer = { amount: 2500, currency: 'usd', interval: 'month', first_month_amount: 2500, first_month_discount_percent: 0 }
const entryToken = `header.${Buffer.from(JSON.stringify({ aud: 'public-checkout' })).toString('base64url')}.signature`

test('get her number leads to a playable demo without payment copy', async ({ page }) => {
  const paymentRequests = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname === '/api/checkout' || /(^|\.)stripe\.com$/.test(url.hostname)) paymentRequests.push(request.url())
  })
  await page.goto('/')
  await page.locator('.halo-cta--hero').click()
  await expect(page).toHaveURL(/\/meet-oro$/)
  await expect(page.getByRole('heading', { name: headingName, exact: true })).toBeVisible()
  const video = page.locator('video')
  await expect(video).toHaveAttribute('controls', '')
  await expect(video).toHaveAttribute('playsinline', '')
  const media = await video.evaluate(element => ({
    src: new URL(element.currentSrc || element.querySelector('source')?.src || element.src).pathname,
    autoplay: element.autoplay,
    paused: element.paused,
  }))
  expect(media).toEqual({ src: demoPath, autoplay: false, paused: true })
  await expect.poll(() => video.evaluate(element => element.readyState)).toBeGreaterThanOrEqual(1)
  const metadata = await video.evaluate(element => ({ duration: element.duration, width: element.videoWidth, height: element.videoHeight }))
  expect(metadata.duration).toBeGreaterThan(24)
  expect(metadata.duration).toBeLessThan(25)
  expect(metadata).toMatchObject({ width: 600, height: 1298 })
  await page.getByRole('button', { name: 'play oro demo', exact: true }).click()
  await expect.poll(() => video.evaluate(element => element.paused)).toBe(false)
  await expect.poll(() => video.evaluate(element => element.currentTime)).toBeGreaterThan(0)
  await expect(page.getByText(/\$25\s*USD\s*\/\s*month/i)).toHaveCount(0)
  await expect(page.getByText('you’ll review your subscription before paying.', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: continueName, exact: true })).toHaveAttribute('href', '/checkout')
  expect(paymentRequests).toEqual([])
})

test('visitors can continue before playing or finishing the recording', async ({ page }) => {
  let checkoutRequests = 0
  await page.route('**/api/checkout?*', route => {
    checkoutRequests += 1
    return route.fulfill({ json: { status: 'checkout', offer, token: entryToken, checkout_url: 'https://checkout.stripe.com/test' } })
  })
  await page.goto('/meet-oro')
  await expect(page.getByRole('heading', { name: headingName, exact: true })).toBeVisible()
  expect(checkoutRequests).toBe(0)
  const video = page.locator('video')
  expect(await video.evaluate(element => element.currentTime)).toBe(0)
  await page.getByRole('link', { name: continueName, exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  expect(checkoutRequests).toBe(1)
})

test('an unavailable recording keeps checkout available', async ({ page }) => {
  await page.route(`**${demoPath}`, route => route.abort('failed'))
  await page.goto('/meet-oro')
  await page.locator('video').evaluate(element => element.load())
  await expect.poll(() => page.locator('video').evaluate(element => Boolean(element.error))).toBe(true)
  await expect(page.getByRole('status')).toContainText('the demo couldn’t load')
  await expect(page.getByRole('link', { name: continueName, exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: continueName, exact: true })).toHaveAttribute('href', '/checkout')
  await page.getByText('read the demo', { exact: true }).click()
  await expect(page.getByText('oro sends a try-on image showing you wearing the outfit.', { exact: true })).toBeVisible()
})

test('the demo carries the invitation into checkout unchanged', async ({ page }) => {
  const referralCode = 'c'.repeat(64)
  await page.goto(`/invite?ref=${referralCode}&src=ig-sunny`)
  const inviteUrl = `${new URL(page.url()).origin}/invite?ref=${referralCode}`
  await page.locator('.beta-welcome .halo-cta--beta_general').click()
  await expect(page).toHaveURL(`/meet-oro?invite=${encodeURIComponent(inviteUrl)}`)
  const continueLink = page.getByRole('link', { name: continueName, exact: true })
  await expect(continueLink).toHaveAttribute('href', `/checkout?invite=${encodeURIComponent(inviteUrl)}`)
  await page.route('**/api/checkout?*', route => route.fulfill({ json: { status: 'checkout', offer, token: entryToken, checkout_url: 'https://checkout.stripe.com/test' } }))
  await continueLink.click()
  await expect(page).toHaveURL(`/checkout?invite=${encodeURIComponent(inviteUrl)}`)
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  expect(await page.evaluate(() => sessionStorage.getItem('oro_checkout_invite'))).toBe(inviteUrl)
})

for (const width of [320, 390, 1440]) {
  test(`the demo and subscription action fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/meet-oro')
    await expect(page.getByRole('heading', { name: headingName, exact: true })).toBeVisible()
    await expect(page.locator('video')).toBeVisible()
    const continueLink = page.getByRole('link', { name: continueName, exact: true })
    await continueLink.scrollIntoViewIfNeeded()
    await expect(continueLink).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })
}

test('personal checkout links bypass the demo', async ({ page }) => {
  const token = 'synthetic.personal.token'
  const operations = []
  await page.route('**/api/checkout?*', route => {
    operations.push(new URL(route.request().url()).searchParams.get('operation'))
    expect(route.request().headers().authorization).toBe(`Bearer ${token}`)
    return route.fulfill({ json: { status: 'checkout', offer, checkout_url: 'https://checkout.stripe.com/test' } })
  })
  await page.goto(`/checkout#token=${token}`)
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.getByRole('heading', { name: headingName, exact: true })).toHaveCount(0)
  expect(operations.length).toBeGreaterThan(0)
  expect(operations.every(operation => operation === 'status')).toBe(true)
})
