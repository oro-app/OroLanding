import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { test, expect } from './fixtures.js'

const CANONICAL_ORIGIN = 'https://www.askoro.now'
const pagePath = (path) => /localhost|127\.0\.0\.1/.test(process.env.E2E_BASE_URL ?? '') ? `${path}/` : path
const ENGINEERING_PATHS = [
  '/research/context-before-composition',
  '/research/evaluating-personal-style',
  '/research/learning-from-specific-feedback',
]
const ROUTES = [
  { path: '/ai-personal-stylist', h1: 'What is an AI personal stylist?', title: 'What Is an AI Personal Stylist? | Oro', answer: 'An AI personal stylist helps you work through clothing choices in a conversation.' },
  { path: '/ai-stylist-you-can-text', h1: 'How do you ask an AI stylist for outfit help over text?', title: 'An AI Stylist You Can Text: How to Ask for Outfit Help | Oro', answer: 'Start with where you are going, what clothes you can use, and how you want to feel.' },
  { path: '/what-to-wear/job-interview', h1: 'What should you wear to a job interview?', title: 'What to Wear to a Job Interview | Oro', answer: 'Wear clean, well-kept clothes that fit the employer’s setting and let you focus on the conversation.' },
  { path: '/what-to-wear/first-date', h1: 'What should you wear on a first date?', title: 'What to Wear on a First Date | Oro', answer: 'Wear something that feels like you and works for the actual plan.' },
  { path: '/what-to-wear/first-day-of-work', h1: 'What should you wear on your first day of work?', title: 'What to Wear on Your First Day of Work | Oro', answer: 'Follow the workplace’s stated dress code, then choose a comfortable outfit that can handle your commute and first-day activities.' },
  { path: '/what-to-wear/brunch', h1: 'What should you wear to brunch?', title: 'What to Wear to Brunch: Comfortable Outfit Ideas | Oro', answer: 'For everyday brunch, wear a comfortable outfit you would enjoy wearing for the rest of the day:' },
  { path: '/dress-codes/business-casual', h1: 'What does business casual mean?', title: 'What Does Business Casual Mean? Outfit Examples | Oro', answer: 'Business casual generally means workplace-appropriate clothing with less formality than a full business suit.' },
  { path: '/dress-codes/smart-casual', h1: 'What does smart casual mean?', title: 'What Is Smart Casual? A Practical Dress-Code Guide | Oro', answer: 'Smart casual usually means a relaxed outfit with a considered, polished finish.' },
  { path: '/guides/style-clothes-you-already-own', h1: 'How do you style clothes you already own?', title: 'How to Style Clothes You Already Own | Oro', answer: 'Start with one piece you want to wear, choose an occasion, and build a complete outfit around it using the clothes you have.' },
  { path: '/guides/i-have-clothes-but-nothing-to-wear', h1: 'Why do I have clothes but feel like I have nothing to wear?', title: 'Why You Have Clothes but Feel Like Nothing to Wear | Oro', answer: 'A full closet can still be hard to dress from when the clothes do not combine easily, do not feel comfortable, or do not suit your current routine.' },
  { path: '/guides', h1: 'Style guides', title: 'Style Guides for Everyday Outfits | Oro', answer: 'Practical answers for getting dressed, understanding dress codes, and making more of the clothes you already own.' },
  { path: '/research', h1: 'Research & Engineering', title: 'Research & Engineering | Oro', answer: 'Notes on the problems behind personal styling: context, outfit quality, and learning from feedback.' },
  { path: '/research/context-before-composition', h1: 'Context before composition', title: 'Context Before Composition | Oro Engineering Notes', answer: 'An outfit recommendation is a decision about a particular person getting dressed for a particular situation.' },
  { path: '/research/evaluating-personal-style', h1: 'Evaluating personal style', title: 'Evaluating Personal Style | Oro Engineering Notes', answer: 'Personal styling allows several reasonable answers to the same request.' },
  { path: '/research/learning-from-specific-feedback', h1: 'Learning from specific feedback', title: 'Learning from Specific Feedback | Oro Engineering Notes', answer: '“I don’t like it” contains an objection, but not necessarily its cause.' },
  { path: '/research/how-people-choose-outfits', h1: 'How people choose outfits', title: 'How People Choose Outfits | Unpublished Oro Research Template', answer: 'This is an unpublished template for a possible report about outfit decisions.' },
]
const REPRESENTATIVE_PATHS = new Set([
  '/ai-personal-stylist',
  '/ai-stylist-you-can-text',
  '/what-to-wear/job-interview',
  '/dress-codes/business-casual',
  '/guides',
  '/research',
  ...ENGINEERING_PATHS,
  '/research/how-people-choose-outfits',
])

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: false } }))
  await page.route('**/api/beta-count', (route) => route.fulfill({ json: { count: 0 } }))
  await page.route('**/api/waitlist', (route) => route.fulfill({ status: 405, json: { error: 'No signup submission is part of GEO verification' } }))
})

async function checkRoute(page, request, route, viewport) {
  await page.setViewportSize(viewport)
  const errors = []
  const assetFailures = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('response', (response) => {
    if (new URL(response.url()).pathname.startsWith('/assets/') && response.status() >= 400) {
      assetFailures.push(`${response.status()} ${response.url()}`)
    }
  })
  const response = await page.goto(pagePath(route.path), { waitUntil: 'domcontentloaded' })
  expect(response.status()).toBe(200)
  const article = page.locator('article.geo-page')
  await expect(article).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.h1)
  await expect(article).toContainText(route.answer)
  await expect(page).toHaveTitle(route.title)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${CANONICAL_ORIGIN}${route.path}`)
  const description = await page.locator('meta[name="description"]').getAttribute('content')
  expect(description.length).toBeGreaterThan(80)
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', route.title)
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description)
  await expect(page.locator('.vite-error-overlay, [data-nextjs-dialog]')).toHaveCount(0)
  const layout = await page.locator('.geo-body').evaluate((body) => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    width: body.getBoundingClientRect().width,
    lineHeight: parseFloat(getComputedStyle(body).lineHeight),
  }))
  expect(layout.overflow).toBe(false)
  expect(layout.width).toBeLessThanOrEqual(721)
  expect(layout.lineHeight).toBeGreaterThan(28)
  const cta = article.getByRole('link', { name: 'Meet Oro', exact: true })
  await expect(cta).toHaveAttribute('href', '/beta')
  const related = article.locator('.geo-related a')
  if (route.path === '/guides') {
    const guideLinks = article.locator('nav.geo-guide-group a')
    await expect(guideLinks).toHaveCount(10)
    const guidePaths = ROUTES.filter((item) => item.path !== '/guides' && !item.path.startsWith('/research')).map((item) => item.path)
    expect((await guideLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).sort()).toEqual(guidePaths.sort())
    for (const href of guidePaths) {
      await expect(article.locator(`nav.geo-guide-group a[href="${href}"]`)).toBeVisible()
      const linkedResponse = await request.get(pagePath(href))
      expect(linkedResponse.status()).toBe(200)
      expect(await linkedResponse.text()).toContain(`href="${CANONICAL_ORIGIN}${href}"`)
    }
  }
  if (!route.path.startsWith('/research') && route.path !== '/guides') {
    expect(await related.count()).toBeGreaterThanOrEqual(2)
    expect(await related.count()).toBeLessThanOrEqual(4)
  }
  for (const link of await related.all()) {
    const href = await link.getAttribute('href')
    expect(href).toMatch(/^\/(?:ai-|what-to-wear\/|dress-codes\/|guides(?:\/|$)|how-it-works$|from-the-closet$|research(?:\/|$))/)
    expect(href).not.toBe(route.path)
    const linkedResponse = await request.get(pagePath(href))
    expect(linkedResponse.status()).toBe(200)
    expect(await linkedResponse.text()).toContain(`href="${CANONICAL_ORIGIN}${href}"`)
  }
  await expect(page.locator('header a[href="/guides"]')).toHaveCount(0)
  await expect(page.locator('footer a[href="/guides"]')).toHaveCount(0)
  await expect(page.locator('footer').getByRole('link', { name: /^style guides$/i })).toHaveCount(0)
  await expect(page.locator('header a[href="/research"], header a[href^="/research/"], footer a[href="/research"], footer a[href^="/research/"]')).toHaveCount(0)
  if (!route.path.startsWith('/research')) {
    await expect(page.locator('a[href="/research"], a[href^="/research/"]')).toHaveCount(0)
  }
  if (route.path === '/research') {
    const noteLinks = article.locator('a[href^="/research/"]')
    await expect(noteLinks).toHaveCount(3)
    expect((await noteLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))).sort()).toEqual([...ENGINEERING_PATHS].sort())
  }
  if (ENGINEERING_PATHS.includes(route.path)) {
    const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())
    const note = graph.find((entity) => entity['@type'] === 'Article')
    expect(note).toBeTruthy()
    expect(note.headline).toBe(route.h1)
    expect(new Date(note.datePublished).toISOString()).toBe(note.datePublished)
    expect(Date.parse(note.datePublished)).toBeLessThanOrEqual(Date.now())
    const author = note.author['@id'] ? graph.find((entity) => entity['@id'] === note.author['@id']) : note.author
    expect(author.name.toLowerCase()).toBe('oro')
    await expect(article.locator('.geo-note-meta')).toContainText('By Oro')
    await expect(article.locator('time')).toHaveCount(1)
    await expect(article.locator('time')).toHaveAttribute('datetime', note.datePublished)
    await expect(article.getByRole('heading', { name: 'Key findings', exact: true })).toHaveCount(0)
    await expect(article.getByText('Sample size', { exact: true })).toHaveCount(0)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'article')
  }
  if (route.path === '/research/how-people-choose-outfits') {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(article).toContainText('Unpublished research template.')
    await expect(article).toContainText('No findings have been published.')
    await expect(article.locator('time, .geo-study-meta')).toHaveCount(0)
  } else {
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow')
  }
  if (process.env.GEO_SCREENSHOT_DIR && REPRESENTATIVE_PATHS.has(route.path)) {
    await mkdir(process.env.GEO_SCREENSHOT_DIR, { recursive: true })
    const slug = route.path.slice(1).replaceAll('/', '-')
    await page.screenshot({ path: join(process.env.GEO_SCREENSHOT_DIR, `${slug}-${viewport.width}.png`), fullPage: true })
  }
  expect(assetFailures).toEqual([])
  expect(errors).toEqual([])
}

for (const route of ROUTES) {
  test(`GEO desktop ${route.path} has readable content and working links`, async ({ page, request }) => {
    await checkRoute(page, request, route, { width: 1440, height: 1000 })
  })
  if (REPRESENTATIVE_PATHS.has(route.path)) {
    test(`GEO mobile ${route.path} has readable content and working links`, async ({ page, request }) => {
      await checkRoute(page, request, route, { width: 390, height: 844 })
    })
  }
}

test('all GEO responses contain distinct metadata and useful content before the beta CTA without running JavaScript', async ({ request }) => {
  const titles = []
  const descriptions = []
  for (const route of ROUTES) {
    const response = await request.get(pagePath(route.path))
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')
    const html = await response.text()
    const answerPosition = html.indexOf(route.answer)
    expect(answerPosition).toBeGreaterThan(-1)
    expect(answerPosition).toBeLessThan(html.indexOf('class="geo-cta"'))
    expect(html).toContain('<h1')
    expect(html).toContain(`href="${CANONICAL_ORIGIN}${route.path}"`)
    titles.push(html.match(/<title>([^<]+)<\/title>/)?.[1])
    descriptions.push(html.match(/<meta name="description" content="([^"]+)"/)?.[1])
  }
  expect(titles.every(Boolean)).toBe(true)
  expect(descriptions.every(Boolean)).toBe(true)
  expect(new Set(titles).size).toBe(ROUTES.length)
  expect(new Set(descriptions).size).toBe(ROUTES.length)
})

test.describe('GEO articles with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false })
  for (const path of ['/what-to-wear/job-interview', '/research/context-before-composition', '/research/how-people-choose-outfits']) {
    test(`${path} is styled and readable before client code runs`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 })
      const route = ROUTES.find((item) => item.path === path)
      await page.goto(pagePath(path))
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.h1)
      await expect(page.locator('article.geo-page')).toContainText(route.answer)
      await expect(page.locator('.geo-body')).toHaveCSS('max-width', '720px')
      await expect(page.locator('.geo-body')).toHaveCSS('line-height', '32.4px')
      await expect(page.locator('.geo-cta').getByRole('link', { name: 'Meet Oro' })).toHaveAttribute('href', '/beta')
    })
  }
})

for (const width of [1440, 390]) {
  test(`GEO related navigation and beta welcome work at ${width}px without submitting`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    await page.route('**/api/beta-request', (route) => route.fulfill({ json: { enabled: true } }))
    const writes = []
    page.on('request', (request) => {
      if (request.method() === 'POST') writes.push(request.url())
    })
    await page.goto(pagePath('/what-to-wear/job-interview'))
    await page.getByRole('navigation', { name: 'Related guides' }).getByRole('link', { name: 'What does business casual mean?', exact: true }).click()
    await expect(page).toHaveURL(/\/dress-codes\/business-casual\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('What does business casual mean?')
    await page.locator('.geo-cta').getByRole('link', { name: 'Meet Oro', exact: true }).click()
    await expect(page).toHaveURL(/\/beta\/?$/)
    await expect(page.getByRole('heading', { name: 'heard you were looking for my number.', exact: true })).toBeVisible()
    await expect(page.getByRole('form')).toHaveCount(0)
    await page.getByRole('button', { name: 'want her number?', exact: true }).click()
    await expect(page).toHaveURL(/\/beta\/?\?step=phone$/)
    await expect(page.getByRole('heading', { name: 'where should oro text you?', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Back', exact: true }).click()
    await expect(page).toHaveURL(/\/beta\/?$/)
    await expect(page.getByRole('heading', { name: 'heard you were looking for my number.', exact: true })).toBeVisible()
    await expect(page.getByRole('form')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(writes).toEqual([])
  })
}

for (const width of [1440, 390]) {
  test(`homepage footer omits Style guides at ${width}px while the hub remains directly accessible`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await page.goto('/')
    await expect(page.locator('header a[href="/guides"]')).toHaveCount(0)
    await expect(page.locator('header').getByRole('link', { name: 'want her number?', exact: true })).toHaveAttribute('href', /^sms:/)
    await expect(page.locator('a[href="/research"], a[href^="/research/"]')).toHaveCount(0)
    await expect(page.locator('footer a[href="/guides"]')).toHaveCount(0)
    await expect(page.locator('footer').getByRole('link', { name: /^style guides$/i })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (process.env.GEO_SCREENSHOT_DIR) {
      await mkdir(process.env.GEO_SCREENSHOT_DIR, { recursive: true })
      await page.locator('footer').screenshot({ path: join(process.env.GEO_SCREENSHOT_DIR, `guides-footer-absent-${width}.png`) })
    }
    await page.goto(pagePath('/guides'))
    await expect(page).toHaveURL(/\/guides\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Style guides')
    await expect(page).toHaveTitle('Style Guides for Everyday Outfits | Oro')
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${CANONICAL_ORIGIN}/guides`)
    await expect(page.locator('article.geo-page nav.geo-guide-group a')).toHaveCount(10)
    expect(errors).toEqual([])
  })
}

test('published engineering notes appear in discovery files while the empirical template stays excluded', async ({ request }) => {
  for (const path of ['/sitemap.xml', '/llms.txt']) {
    const response = await request.get(path)
    expect(response.status()).toBe(200)
    const text = await response.text()
    expect(text).toContain(`${CANONICAL_ORIGIN}/guides`)
    expect(text).toContain(`${CANONICAL_ORIGIN}/research`)
    for (const path of ENGINEERING_PATHS) expect(text).toContain(`${CANONICAL_ORIGIN}${path}`)
    expect(text).not.toContain(`${CANONICAL_ORIGIN}/research/how-people-choose-outfits`)
  }
})
