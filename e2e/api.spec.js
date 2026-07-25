import { test, expect, deploymentOnly } from './fixtures'

// Pure-HTTP tests against the real serverless functions — read-only, no rows
// are ever written. Only runnable on a real Vercel deployment.
test.beforeEach(deploymentOnly)

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36'
const DESKTOP_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'

// Follow same-site redirects (e.g. production's apex → www hop) until we hit
// the actual function response, then return it for assertions.
async function getThroughSiteRedirects(request, path, headers) {
  let url = path
  for (let hop = 0; hop < 4; hop++) {
    const res = await request.get(url, { headers, maxRedirects: 0 })
    const location = res.headers()['location']
    const isRedirect = res.status() >= 300 && res.status() < 400
    // Stop when it's not a redirect, or the redirect leaves the site
    // (app-store URLs) or changes the path (the answer we care about).
    if (!isRedirect || !location || new URL(location, res.url()).pathname !== new URL(url, res.url()).pathname) {
      return res
    }
    url = location
  }
  throw new Error(`Too many same-path redirects for ${path}`)
}

test.describe('/app smart install redirect', () => {
  const cases = [
    { name: 'iPhone → App Store', ua: IPHONE_UA, location: /apps\.apple\.com/ },
    { name: 'Android → Play Store', ua: ANDROID_UA, location: /play\.google\.com/ },
    { name: 'desktop → landing page', ua: DESKTOP_UA, location: /^\/$/ },
  ]

  for (const { name, ua, location } of cases) {
    test(`${name} @smoke`, async ({ request }) => {
      const res = await getThroughSiteRedirects(request, '/app', { 'user-agent': ua })
      expect(res.status()).toBe(302)
      expect(res.headers()['location']).toMatch(location)
      expect(res.headers()['cache-control']).toBe('no-store')
    })
  }
})

test('/api/unsubscribe rejects a garbage token', async ({ request }) => {
  const res = await request.get('/api/unsubscribe?token=garbage')
  expect(res.status()).toBe(400)
})

test('/api/waitlist rejects non-POST methods', async ({ request }) => {
  const res = await request.get('/api/waitlist')
  expect(res.status()).toBe(405)
})
