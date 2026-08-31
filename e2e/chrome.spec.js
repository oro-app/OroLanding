import { test, expect } from './fixtures'

// --site-header-height / --site-footer-height feed every viewport calculation
// on the site (the full-height hero, the phone's max height, page min-heights).
// They are literals, so they drift silently when the chrome changes size — the
// footer grew 11px when its wordmark did, and short pages started overflowing.

async function chromeMetrics(page) {
  return page.evaluate(() => {
    const varPx = (name) =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))
    return {
      headerVar: varPx('--site-header-height'),
      headerActual: document.querySelector('.site-header').getBoundingClientRect().height,
      footerVar: varPx('--site-footer-height'),
      footerActual: document.querySelector('.site-footer').getBoundingClientRect().height,
    }
  })
}

test('chrome height variables match the rendered chrome @smoke', async ({ page }) => {
  await page.goto('/')
  const m = await chromeMetrics(page)
  expect(m.headerVar).toBeCloseTo(m.headerActual, 0)
  expect(m.footerVar).toBeCloseTo(m.footerActual, 0)
})

test('a short page fits the viewport without scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  // The not-found view is the shortest page the site can render.
  await page.goto('/newsletter/does-not-exist')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('the hero fills the screen below the header', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const m = await page.evaluate(() => {
    const hero = document.querySelector('.home-hero').getBoundingClientRect()
    const next = document.querySelector('.home-block').getBoundingClientRect()
    return { heroHeight: hero.height, nextTop: next.top, viewport: window.innerHeight }
  })
  // No part of the following section is on screen at rest.
  expect(m.nextTop).toBeGreaterThanOrEqual(m.viewport)
  expect(m.heroHeight).toBeGreaterThanOrEqual(m.viewport - 80)
})
