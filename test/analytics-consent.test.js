import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { transformSync } from 'esbuild'

const source = transformSync(readFileSync(new URL('../src/lib/analytics.js', import.meta.url), 'utf8'), {
  format: 'cjs', define: { 'import.meta.env': '{"DEV":false}' },
}).code

function analyticsWithStorage(getItem) {
  const events = []
  const module = { exports: {} }
  runInNewContext(source, {
    module, exports: module.exports,
    localStorage: { getItem },
    window: { gtag: (...args) => events.push(args) },
    document: { getElementById: () => ({}) },
  })
  return { analytics: module.exports, events }
}

test('blocked storage disables analytics without interrupting checkout tracking callers', () => {
  const { analytics, events } = analyticsWithStorage(() => { throw new Error('Storage blocked') })
  assert.equal(analytics.hasAnalyticsConsent(), false)
  assert.doesNotThrow(() => analytics.trackEvent('begin_checkout'))
  assert.doesNotThrow(() => analytics.trackEvent('order_checkout_error'))
  assert.equal(events.length, 0)
})

test('declined or undecided consent does not initialize GA or emit order events', () => {
  for (const choice of [null, 'declined']) {
    const { analytics, events } = analyticsWithStorage(() => choice)
    analytics.trackEvent('view_item')
    analytics.trackEvent('begin_checkout')
    assert.equal(events.length, 0)
  }
})

test('accepted consent forwards ecommerce values and items to GA', () => {
  const { analytics, events } = analyticsWithStorage(() => 'accepted')
  const params = { currency: 'CAD', value: 49.99, items: [{ item_id: 'product', item_variant: 'M', price: 49.99, quantity: 1 }] }
  analytics.trackEvent('begin_checkout', params)
  assert.equal(events.filter(args => args[0] === 'config').length, 1)
  assert.deepEqual(events.find(args => args[1] === 'begin_checkout'), ['event', 'begin_checkout', params])
})
