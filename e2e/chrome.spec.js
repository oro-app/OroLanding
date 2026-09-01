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

test('the pinned stage fills the screen below the header', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const m = await page.evaluate(() => {
    const stage = document.querySelector('.home-stage').getBoundingClientRect()
    return {
      stageTop: Math.round(stage.top),
      stageHeight: Math.round(stage.height),
      viewport: window.innerHeight,
      headerHeight: Math.round(document.querySelector('.site-header').getBoundingClientRect().height),
      activePanels: document.querySelectorAll('.home-panel.is-active').length,
    }
  })
  expect(m.stageTop).toBe(m.headerHeight)
  expect(m.stageHeight).toBe(m.viewport - m.headerHeight)
  // Exactly one panel is shown at a time.
  expect(m.activePanels).toBe(1)
})

test('scrolling swaps the pinned panels', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const activeText = () =>
    page.evaluate(() => document.querySelector('.home-panel.is-active')?.textContent?.trim() ?? '')

  const first = await activeText()
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(700)
  const second = await activeText()

  expect(first).not.toBe(second)
  // The phone stays put while the panels change.
  const pinned = await page.evaluate(() =>
    Math.round(document.querySelector('.home-stage').getBoundingClientRect().top),
  )
  expect(pinned).toBe(73)
})
