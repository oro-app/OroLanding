import { test, expect } from './fixtures.js'

test('the homepage headline rotates promptly and keeps a readable pause', async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ status: 200, json: { count: 0 } }))
  await page.addInitScript(() => {
    window.oroHeadlineChanges = []
    let previous = ''
    new MutationObserver(() => {
      const active = document.querySelector('.oro-rot-phrase[data-state="in"]')
      if (active && active.textContent !== previous) {
        previous = active.textContent
        window.oroHeadlineChanges.push({ text: previous, time: performance.now() })
      }
    }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] })
  })
  await page.goto('/')
  await expect.poll(() => page.evaluate(() => window.oroHeadlineChanges.length), { timeout: 6500 }).toBeGreaterThanOrEqual(3)
  const changes = await page.evaluate(() => window.oroHeadlineChanges.slice(0, 3))
  expect(changes.map(change => change.text)).toEqual(['you can text', 'that knows your closet', 'that gets your style'])
  const firstHold = changes[1].time - changes[0].time
  const nextHold = changes[2].time - changes[1].time
  expect(firstHold).toBeGreaterThan(1400)
  expect(firstHold).toBeLessThan(2800)
  expect(nextHold).toBeGreaterThan(1800)
  expect(nextHold).toBeLessThan(2800)
})

test('reduced motion keeps the homepage headline still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.route('**/api/**', route => route.fulfill({ status: 200, json: { count: 0 } }))
  await page.goto('/')
  await expect(page.locator('.oro-rot-phrase[data-state="in"]')).toHaveText('you can text')
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2600)))
  await expect(page.locator('.oro-rot-phrase[data-state="in"]')).toHaveText('you can text')
})
