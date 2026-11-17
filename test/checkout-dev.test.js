import assert from 'node:assert/strict'
import { Readable } from 'node:stream'
import test from 'node:test'
import checkoutDev from '../scripts/checkout-dev.js'

test('local order reaches the Shopify handler instead of the legacy proxy', async t => {
  let middleware
  checkoutDev().configureServer({ middlewares: { use(fn) { middleware = fn } } })
  t.mock.method(globalThis, 'fetch', async () => assert.fail('Unsupported methods must not call upstream'))
  const req = Readable.from([])
  Object.assign(req, { url: '/api/order', method: 'DELETE' })
  const res = { setHeader() {}, end(value) { this.body = JSON.parse(value) } }
  await middleware(req, res, () => assert.fail('Order must not reach the legacy proxy'))
  assert.equal(res.statusCode, 405)
  assert.deepEqual(res.body, { error: 'Method not allowed.' })
})

test('local checkout uses the production handler and preserves acceptance data', async t => {
  let middleware
  checkoutDev().configureServer({ middlewares: { use(fn) { middleware = fn } } })
  const upstream = t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'checkout_ready' }))
  const req = Readable.from([JSON.stringify({ phone: '+14165550123', terms_accepted: true, texting_consent: true })])
  Object.assign(req, { url: '/api/checkout?operation=entry-accept', method: 'POST', headers: { authorization: 'Bearer synthetic.token.value' } })
  const res = { setHeader() {}, end(value) { this.body = JSON.parse(value) } }
  await middleware(req, res, () => assert.fail('Checkout must not reach the legacy proxy'))
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { status: 'checkout_ready' })
  const [url, options] = upstream.mock.calls[0].arguments
  assert.equal(url.pathname, '/public-onboarding/entry/accept')
  assert.equal(options.headers.Authorization, 'Bearer synthetic.token.value')
  assert.equal(JSON.parse(options.body).phone, '+14165550123')
  let passed = false
  await middleware({ url: '/api/other' }, {}, () => { passed = true })
  assert.equal(passed, true)
})
