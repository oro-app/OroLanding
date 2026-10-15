import { test, expect } from './fixtures.js'

const continueName = 'meet my stylist'
const endcardQuestion = 'ready to see what oro can do with your closet?'
const skipName = 'skip video and continue to checkout'
const demoPath = '/demos/oro-onboarding-demo.mp4'
const offer = { amount: 2500, currency: 'usd', interval: 'month', first_month_amount: 2500, first_month_discount_percent: 0 }
const entryToken = `header.${Buffer.from(JSON.stringify({ aud: 'public-checkout' })).toString('base64url')}.signature`
const checkoutResponse = { status: 'checkout', offer, token: entryToken, checkout_url: 'https://checkout.stripe.com/test' }

const expectPlaying = async page => {
  const video = page.locator('video')
  await expect.poll(() => video.evaluate(element => !element.paused && element.currentTime > 0)).toBe(true)
  await expect(page.locator('.meet-oro-stage')).toHaveAttribute('data-state', 'playing')
  return video
}

const finishRecording = async page => {
  const video = await expectPlaying(page)
  await expect.poll(() => video.evaluate(element => element.readyState)).toBeGreaterThanOrEqual(1)
  await video.evaluate(async element => {
    element.currentTime = element.duration - 0.08
    await element.play()
  })
  await expect(page.locator('.meet-oro-stage')).toHaveAttribute('data-state', 'ended')
  await expect(page.getByRole('link', { name: continueName, exact: true })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({
    status: new URL(route.request().url()).pathname === '/api/beta-count' ? 200 : 503,
    json: { count: 0 },
  }))
})

test('the main CTA opens only the recording and starts playback before payment', async ({ page }) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const paymentRequests = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname === '/api/checkout' || /(^|\.)stripe\.com$/.test(url.hostname)) paymentRequests.push(request.url())
  })
  await page.goto('/')
  await page.locator('.halo-cta--hero').click()
  await expect(page).toHaveURL(/\/meet-oro$/)
  await expect(page.locator('.meet-oro--immersive')).toBeVisible()
  await expect(page.locator('header, footer, .cookie-consent-wrap')).toHaveCount(0)
  await expect(page.locator('.meet-oro-accessible')).toHaveCSS('clip-path', 'inset(50%)')
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  const video = await expectPlaying(page)
  await expect(video).toHaveAttribute('controls', '')
  await expect(video).toHaveAttribute('autoplay', '')
  await expect(video).toHaveAttribute('playsinline', '')
  await expect(video).toHaveAttribute('preload', 'auto')
  const media = await video.evaluate(element => ({
    src: new URL(element.currentSrc || element.querySelector('source')?.src || element.src).pathname,
    muted: element.muted,
    duration: element.duration,
    width: element.videoWidth,
    height: element.videoHeight,
  }))
  expect(media).toMatchObject({ src: demoPath, muted: true, width: 600, height: 1298 })
  expect(media.duration).toBeGreaterThan(24)
  expect(media.duration).toBeLessThan(25)
  const startedAt = await video.evaluate(element => element.currentTime)
  await expect.poll(() => video.evaluate(element => element.currentTime)).toBeGreaterThan(startedAt + 0.2)
  await expect(page.getByRole('link', { name: skipName, exact: true })).toHaveAttribute('href', '/checkout')
  await expect(page.getByRole('link', { name: continueName, exact: true })).toHaveCount(0)
  await expect(page.getByText(/\$25\s*USD\s*\/\s*month/i)).toHaveCount(0)
  await expect(page.getByText('you’ll review your subscription before paying.', { exact: true })).toHaveCount(0)
  expect(paymentRequests).toEqual([])
  expect(errors).toEqual([])
})

test('visitors can skip the playing recording and begin checkout', async ({ page }) => {
  let checkoutRequests = 0
  await page.route('**/api/checkout?*', route => {
    checkoutRequests += 1
    return route.fulfill({ json: checkoutResponse })
  })
  await page.goto('/meet-oro')
  await expectPlaying(page)
  expect(checkoutRequests).toBe(0)
  await page.getByRole('link', { name: skipName, exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.locator('.oro-checkout-route')).toHaveCSS('background-color', 'rgb(252, 251, 255)')
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  expect(checkoutRequests).toBe(1)
})

test('finishing offers checkout or a replay without starting a payment session', async ({ page }) => {
  let checkoutRequests = 0
  await page.route('**/api/checkout?*', route => {
    checkoutRequests += 1
    return route.fulfill({ json: checkoutResponse })
  })
  await page.goto('/meet-oro')
  await expectPlaying(page)
  await finishRecording(page)
  await expect(page.getByRole('heading', { name: endcardQuestion })).toBeVisible()
  await expect(page.locator('video')).not.toHaveAttribute('controls')
  await expect(page.getByRole('link', { name: continueName, exact: true })).toHaveAttribute('href', '/checkout')
  expect(checkoutRequests).toBe(0)
  await page.getByRole('button', { name: 'watch again', exact: true }).click()
  const video = await expectPlaying(page)
  expect(await video.evaluate(element => element.currentTime)).toBeLessThan(2)
  await expect(page.getByRole('link', { name: continueName, exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: endcardQuestion })).toHaveCount(0)
  await finishRecording(page)
  expect(checkoutRequests).toBe(0)
  await page.getByRole('link', { name: continueName, exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  expect(checkoutRequests).toBe(1)
})

test('the recording holds its opening frame until its entrance completes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/meet-oro')
  const video = page.locator('video')
  const playback = await video.evaluate(element => {
    const playing = () => ({ time: element.currentTime, opacity: Number(getComputedStyle(element).opacity), blur: getComputedStyle(element).filter })
    if (!element.paused) return playing()
    return new Promise(resolve => element.addEventListener('playing', () => resolve(playing()), { once: true }))
  })
  expect(playback.opacity).toBe(1)
  expect(playback.blur).toBe('none')
  expect(playback.time).toBeLessThan(.5)
  await expectPlaying(page)
})

test('the final frame rests before the invitation appears', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/meet-oro')
  const video = await expectPlaying(page)
  await page.evaluate(() => {
    document.querySelector('video').addEventListener('ended', () => {
      window.oroEndedAt = performance.now()
      const observer = new MutationObserver(() => {
        if (!document.querySelector('.meet-oro-endcard')) return
        window.oroEndcardDelay = performance.now() - window.oroEndedAt
        observer.disconnect()
      })
      observer.observe(document.querySelector('.meet-oro-stage'), { childList: true })
    }, { once: true })
  })
  await video.evaluate(element => { element.currentTime = element.duration - .08 })
  await expect(page.getByRole('heading', { name: endcardQuestion })).toBeVisible()
  expect(await page.evaluate(() => window.oroEndcardDelay)).toBeGreaterThanOrEqual(450)
})

test('the CTA departure resets when the source page returns from the browser cache', async ({ page }) => {
  await page.goto('/')
  const departure = await page.locator('.halo-cta--hero').evaluate(element => new Promise(resolve => {
    const overlay = document.querySelector('.oro-demo-transition')
    const observer = new MutationObserver(() => {
      if (!overlay.hasAttribute('data-departing')) return
      observer.disconnect()
      const marked = element.hasAttribute('data-demo-departing')
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
      resolve(marked)
    })
    observer.observe(overlay, { attributes: true })
    element.click()
  }))
  expect(departure).toBe(true)
  await expect(page.locator('.oro-demo-transition')).not.toHaveAttribute('data-departing')
  await expect(page.locator('.halo-cta--hero')).not.toHaveAttribute('data-demo-departing')
  await page.waitForTimeout(400)
  await expect(page).toHaveURL(/\/$/)
  await page.locator('.halo-cta--hero').click()
  await expect(page).toHaveURL(/\/meet-oro$/)
  await expectPlaying(page)
})

test('a blocked autoplay attempt provides a working play button', async ({ page }) => {
  await page.addInitScript(() => {
    const nativePlay = HTMLMediaElement.prototype.play
    let blocked = true
    document.addEventListener('pointerdown', () => { blocked = false }, { capture: true })
    new MutationObserver(() => {
      document.querySelectorAll('video[autoplay]').forEach(video => video.removeAttribute('autoplay'))
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['autoplay'] })
    HTMLMediaElement.prototype.play = function (...args) {
      if (blocked) {
        this.pause()
        return Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'))
      }
      return nativePlay.apply(this, args)
    }
  })
  await page.goto('/meet-oro')
  const playButton = page.getByRole('button', { name: 'play oro demo', exact: true })
  await expect(playButton).toBeVisible()
  await expect(page.getByRole('link', { name: skipName, exact: true })).toBeVisible()
  await playButton.click()
  await expectPlaying(page)
})

test('browser Back from checkout restores a playing, interactive recording', async ({ page }) => {
  await page.route('**/api/checkout?*', route => route.fulfill({ json: checkoutResponse }))
  await page.goto('/meet-oro#demo')
  await expectPlaying(page)
  await page.getByRole('link', { name: skipName, exact: true }).click()
  await expect(page).toHaveURL(/\/checkout$/)
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  await page.goBack()
  await expect(page).toHaveURL(/\/meet-oro#demo$/)
  const stage = page.locator('.meet-oro-stage')
  await expect(stage).toHaveAttribute('aria-busy', 'false')
  expect(await stage.evaluate(element => element.inert)).toBe(false)
  await expectPlaying(page)
  await expect(page.getByRole('link', { name: skipName, exact: true })).toBeEnabled()
})

test('a persisted pageshow cancels an exit and resumes a paused recording', async ({ page }) => {
  let checkoutRequests = 0
  await page.route('**/api/checkout?*', route => {
    checkoutRequests += 1
    return route.fulfill({ status: 503, json: {} })
  })
  await page.goto('/meet-oro#demo')
  await expectPlaying(page)
  const exitState = await page.getByRole('link', { name: skipName, exact: true }).evaluate(element => new Promise(resolve => {
    const stage = document.querySelector('.meet-oro-stage')
    const observer = new MutationObserver(() => {
      if (stage.dataset.phase !== 'exit') return
      observer.disconnect()
      const exiting = { phase: stage.dataset.phase, inert: stage.inert }
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))
      resolve(exiting)
    })
    observer.observe(stage, { attributes: true, attributeFilter: ['data-phase'] })
    element.click()
  }))
  expect(exitState).toEqual({ phase: 'exit', inert: true })
  const stage = page.locator('.meet-oro-stage')
  await expect(stage).toHaveAttribute('data-phase', 'enter')
  await expect(stage).toHaveAttribute('aria-busy', 'false')
  expect(await stage.evaluate(element => element.inert)).toBe(false)
  await expectPlaying(page)
  await expect(page).toHaveURL(/\/meet-oro#demo$/)
  expect(checkoutRequests).toBe(0)
})

test('a persisted pageshow preserves the completed recording and its choices', async ({ page }) => {
  await page.goto('/meet-oro')
  await expectPlaying(page)
  await finishRecording(page)
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })))
  await expect(page.locator('.meet-oro-stage')).toHaveAttribute('data-state', 'ended')
  expect(await page.locator('video').evaluate(element => element.paused)).toBe(true)
  await expect(page.getByRole('link', { name: continueName, exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'watch again', exact: true })).toBeVisible()
})

test('reduced motion keeps playback while removing decorative transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/meet-oro')
  await expectPlaying(page)
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0)
  await finishRecording(page)
  await expect(page.getByRole('link', { name: continueName, exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0)
})

test('the completed recording action stays flat when hovered and focused', async ({ page }) => {
  await page.goto('/meet-oro')
  await finishRecording(page)
  const continueLink = page.getByRole('link', { name: continueName, exact: true })
  for (const state of ['normal', 'hover', 'focus']) {
    if (state === 'hover') await continueLink.hover()
    if (state === 'focus') await continueLink.focus()
    await expect(continueLink).toHaveCSS('box-shadow', 'none')
    await expect(continueLink).toHaveCSS('transform', 'none')
  }
})

test('an unavailable recording explains the failure and keeps checkout available', async ({ page }) => {
  await page.route(`**${demoPath}`, route => route.abort('failed'))
  await page.goto('/meet-oro')
  await expect(page.getByRole('status')).toContainText('the video couldn’t load')
  await expect(page.locator('.meet-oro-stage')).toHaveAttribute('data-state', 'error')
  await expect(page.getByRole('link', { name: continueName, exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: continueName, exact: true })).toHaveAttribute('href', '/checkout')
  await expect(page.getByRole('button', { name: 'play oro demo', exact: true })).toHaveCount(0)
})

test('both exit paths carry the invitation into checkout unchanged', async ({ page }) => {
  const referralCode = 'c'.repeat(64)
  await page.goto(`/invite?ref=${referralCode}&src=ig-sunny`)
  const inviteUrl = `${new URL(page.url()).origin}/invite?ref=${referralCode}`
  await page.locator('.beta-welcome .halo-cta--beta_general').click()
  await expect(page).toHaveURL(`/meet-oro?invite=${encodeURIComponent(inviteUrl)}`)
  const checkoutHref = `/checkout?invite=${encodeURIComponent(inviteUrl)}`
  await expect(page.getByRole('link', { name: skipName, exact: true })).toHaveAttribute('href', checkoutHref)
  await finishRecording(page)
  const continueLink = page.getByRole('link', { name: continueName, exact: true })
  await expect(continueLink).toHaveAttribute('href', checkoutHref)
  await page.route('**/api/checkout?*', route => route.fulfill({ json: checkoutResponse }))
  await continueLink.click()
  await expect(page).toHaveURL(checkoutHref)
  await expect(page.locator('.checkout-price')).toHaveText('$25')
  expect(await page.evaluate(() => sessionStorage.getItem('oro_checkout_invite'))).toBe(inviteUrl)
})

for (const width of [320, 390, 1440]) {
  test(`the immersive recording and completed actions fit a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/meet-oro')
    const video = await expectPlaying(page)
    await expect(video).toBeInViewport()
    const stageBox = await page.locator('.meet-oro-stage').boundingBox()
    expect(stageBox.x).toBe(0)
    expect(stageBox.y).toBe(0)
    expect(stageBox.width).toBeCloseTo(width, 0)
    expect(stageBox.height).toBeCloseTo(900, 0)
    const videoBox = await video.boundingBox()
    expect(videoBox.x).toBeGreaterThanOrEqual(0)
    expect(videoBox.y).toBeGreaterThanOrEqual(0)
    expect(videoBox.x + videoBox.width).toBeLessThanOrEqual(width)
    expect(videoBox.y + videoBox.height).toBeLessThanOrEqual(900)
    await expect(page.getByRole('link', { name: skipName, exact: true })).toBeInViewport()
    await finishRecording(page)
    await expect(page.getByRole('link', { name: continueName, exact: true })).toBeInViewport()
    await expect(page.getByRole('button', { name: 'watch again', exact: true })).toBeInViewport()
    const overflow = await page.evaluate(() => ({ horizontal: document.documentElement.scrollWidth - innerWidth, vertical: document.documentElement.scrollHeight - innerHeight }))
    expect(overflow.horizontal).toBeLessThanOrEqual(1)
    expect(overflow.vertical).toBeLessThanOrEqual(1)
  })
}

test('personal checkout links bypass the recording', async ({ page }) => {
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
  await expect(page.locator('.meet-oro--immersive')).toHaveCount(0)
  expect(operations.length).toBeGreaterThan(0)
  expect(operations.every(operation => operation === 'status')).toBe(true)
})
