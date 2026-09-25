import { test, expect, deploymentOnly } from './fixtures'

const token = 'synthetic-feedback-token'
const session = (page) => page.evaluate(() => JSON.parse(sessionStorage.getItem('oro_feedback_session')))
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('oro_cookie_consent', 'accepted')
    window.dataLayer = []
    window.gtag = (...args) => window.dataLayer.push(args)
  })
})

for (const path of ['/feedback', '/feedback/', '/feedback/index.html']) {
  test(`private entry and refresh at ${path}`, async ({ page }) => {
    const requests = [], logs = []
    page.on('request', (request) => requests.push(request.url()))
    page.on('console', (message) => logs.push(message.text()))
    page.on('pageerror', (error) => logs.push(error.message))
    await page.goto(`${path}#token=${token}`)
    await expect(page.getByRole('status')).toContainText('Feedback is not available yet')
    expect(new URL(page.url()).hash).toBe('')
    expect(await session(page)).toEqual({ token })
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await page.reload()
    await expect(page.getByRole('status')).toContainText('Feedback is not available yet')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('main')).toBeFocused()
    expect(await session(page)).toEqual({ token })
    const captured = await page.evaluate(() => JSON.stringify([document.body.innerHTML, localStorage, document.cookie, window.dataLayer]))
    expect(captured).not.toContain(token)
    expect(await page.evaluate(() => window.dataLayer)).toEqual([])
    expect(requests.filter((url) => /google-analytics|googletagmanager|posthog/.test(url))).toEqual([])
    expect(requests.join()).not.toContain(token)
    expect(logs).toEqual([])
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await expect(page.getByRole('link', { name: 'Email us' })).toBeInViewport()
    }
  })
}

test('invitation replacement, malformed links and separate tabs', async ({ page, context }) => {
  await page.goto(`/feedback#token=${token}`)
  await expect.poll(() => session(page)).toEqual({ token })
  await page.evaluate(() => sessionStorage.setItem('oro_feedback_session', JSON.stringify({ token: 'old', answers: { old: true }, submission_id: 'old' })))
  await page.goto(`/feedback#token=${token}`)
  await expect.poll(() => session(page)).toEqual({ token })
  const other = await context.newPage()
  await other.goto('/feedback')
  await expect(other.getByRole('status')).toContainText('personal feedback link')
  await other.goto('/feedback#token=another-invitation')
  await expect.poll(() => session(other)).toEqual({ token: 'another-invitation' })
  for (const hash of ['#token=', '#token=%', '#token=a&token=b', '#unknown']) {
    await page.goto(`/feedback#token=${token}`)
    await expect.poll(() => session(page)).toEqual({ token })
    await page.goto(`/feedback${hash}`)
    await expect.poll(() => session(page)).toBeNull()
    await expect(page.getByRole('status')).toContainText('personal feedback link')
    expect(new URL(page.url()).hash).toBe('')
  }
  expect(await session(other)).toEqual({ token: 'another-invitation' })
  await other.close()
})

test('blocked storage still removes the invitation fragment', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new Error('Storage blocked') } }))
  await page.goto(`/feedback#token=${token}`)
  await expect(page.getByRole('status')).toContainText('Allow browser storage')
  expect(new URL(page.url()).hash).toBe('')
  expect(await page.locator('body').textContent()).not.toContain(token)
})

test('feedback stays out of public indexes', async ({ request }) => {
  for (const path of ['/sitemap.xml', '/llms.txt']) {
    expect(await (await request.get(path)).text()).not.toContain('/feedback')
  }
})

test('deployed feedback HTML has private headers', async ({ request }) => {
  deploymentOnly()
  for (const path of ['/feedback', '/feedback/', '/feedback/index.html']) {
    const response = await request.get(path)
    expect(response.ok()).toBe(true)
    expect(response.headers()['cache-control']).toContain('no-store')
    expect(response.headers()['referrer-policy']).toBe('no-referrer')
    expect(response.headers()['x-robots-tag']).toContain('noindex')
  }
})
