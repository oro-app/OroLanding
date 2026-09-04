import { test, expect, deploymentOnly } from './fixtures'

const SPA_ROUTES = [
  '/from-the-closet',
  '/contact',
  '/get-started',
]

for (const route of SPA_ROUTES) {
  test(`SPA route ${route} renders`, async ({ page }) => {
    // domcontentloaded: some pages have slow media that delays the load event.
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(response.status()).toBe(200)
    await expect(page.locator('#root > *').first()).toBeVisible()
  })
}

test('unknown path falls back to home', async ({ page }) => {
  await page.goto('/definitely-not-a-real-page')
  // App.jsx getRouteFromPath falls back to the home view.
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ai stylist you can text')
})

test.describe('vercel.json rewrites and redirects', () => {
  test.beforeEach(deploymentOnly)

  // Follow redirects to the end — production also has an apex → www hop,
  // so asserting the first Location header is host-dependent.
  const REDIRECTS = [
    ['/journal', '/from-the-closet'],
    ['/try-oro', '/get-started'],
    ['/how-it-works', '/'],
    ['/why-oro', '/'],
    ['/honestly', '/'],
    ['/manifesto', '/'],
  ]

  for (const [from, to] of REDIRECTS) {
    test(`${from} redirects to ${to}`, async ({ page }) => {
      await page.goto(from, { waitUntil: 'domcontentloaded' })
      expect(new URL(page.url()).pathname).toBe(to)
    })
  }

  test('legal page /terms serves static HTML @smoke', async ({ page }) => {
    const response = await page.goto('/terms')
    expect(response.status()).toBe(200)
    await expect(page.locator('body')).toContainText(/terms/i)
  })

  for (const path of ['/privacy', '/cookies']) {
    test(`legal page ${path} serves static HTML`, async ({ request }) => {
      const res = await request.get(path)
      expect(res.status()).toBe(200)
      expect(res.headers()['content-type']).toContain('text/html')
    })
  }
})
