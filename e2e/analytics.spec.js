import { test, expect } from './fixtures'

test.use({ seedStorage: false })

for (const [path, routeType] of [
  ['/beta', 'beta'],
  ['/feedback', 'feedback'],
  ['/get-started', 'get-started'],
]) {
  test(`${path} loads consent-gated analytics with the current route tag`, async ({ page }) => {
    await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: false } }))
    await page.addInitScript(() => {
      localStorage.setItem('oro_cookie_consent', 'accepted')
      window.dataLayer = []
      window.gtag = (...args) => window.dataLayer.push(args)
    })

    await page.goto(path)

    await expect.poll(() => page.evaluate((expectedRouteType) => (
      window.dataLayer.some(([command, eventName, params]) => (
        command === 'event'
        && eventName === 'page_view'
        && params?.route_type === expectedRouteType
      ))
    ), routeType)).toBe(true)

    const analyticsState = await page.evaluate(() => JSON.stringify(window.dataLayer))
    expect(analyticsState).not.toMatch(/token|answer|phone|verification|submission/i)
  })
}

test('accepting on a private route tags the consent page view', async ({ page }) => {
  await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: false } }))
  await page.goto('/beta')
  await page.locator('.cookie-consent-accept').click()

  await expect.poll(() => page.evaluate(() => (
    window.dataLayer.some((args) => (
      args[0] === 'event'
      && args[1] === 'page_view'
      && args[2]?.route_type === 'beta'
      && args[2]?.consent_source === 'cookie_banner'
    ))
  ))).toBe(true)
})
