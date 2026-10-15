import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/checkout.js'
import { checkoutRequest, countdown, validOffer, startPublicCheckout } from '../src/lib/checkout.js'

const token = 'synthetic.personal.token'
const offer = { amount: 2500, currency: 'usd', interval: 'month', first_month_amount: 1250,
  first_month_discount_percent: 50, launch_offer_ends_at: '2026-10-14T04:00:00Z' }
function response() {
  return { headers: {}, setHeader(key, value) { this.headers[key] = value },
    status(code) { this.code = code; return this }, json(value) { this.body = value; return this } }
}

test('quote validation rejects an incorrect price, currency, or recurring discount', () => {
  assert.equal(validOffer(offer), true)
  for (const changes of [{ amount: 1250 }, { currency: 'cad' }, { interval: 'year' },
    { first_month_discount_percent: 100 }, { launch_offer_ends_at: 'invalid' }]) {
    assert.equal(validOffer({ ...offer, ...changes }), false)
  }
  assert.equal(validOffer({ ...offer, first_month_amount: 2500, first_month_discount_percent: 0 }), true)
})

test('countdown reaches zero exactly at midnight Eastern, without resetting on reload', () => {
  assert.deepEqual(countdown(offer.launch_offer_ends_at, Date.parse('2026-10-14T03:59:59Z')), ['00', '00', '01'])
  assert.deepEqual(countdown(offer.launch_offer_ends_at, Date.parse('2026-10-14T04:00:00Z')), ['00', '00', '00'])
})

test('browser requests send the personal credential only in the authorization header', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'checkout_ready', offer }))
  await checkoutRequest(token)
  const [url, options] = mock.mock.calls[0].arguments
  assert.equal(url, '/api/checkout?operation=status')
  assert.equal(options.headers.Authorization, `Bearer ${token}`)
  assert.equal(options.referrerPolicy, 'no-referrer')
  assert.equal(options.cache, 'no-store')
  assert.equal(options.credentials, 'same-origin')
  assert.equal(options.redirect, 'error')
  await assert.rejects(checkoutRequest('invalid'), /personal checkout/)
  assert.equal(mock.mock.callCount(), 1)
})

test('proxy rejects methods and missing credentials before contacting the backend', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not call') })
  for (const [request, code] of [
    [{ method: 'POST', query: {}, headers: {} }, 405],
    [{ method: 'GET', query: {}, headers: {} }, 401],
    [{ method: 'GET', query: { operation: 'other' }, headers: {} }, 400],
  ]) {
    const result = response()
    await handler(request, result)
    assert.equal(result.code, code)
    assert.equal(result.headers['Cache-Control'], 'no-store')
  }
  assert.equal(mock.mock.callCount(), 0)
})

test('checkout distinguishes rejected credentials from temporary failures', async t => {
  const mock = t.mock.method(globalThis, 'fetch')
  for (const status of [401, 403, 410]) {
    mock.mock.mockImplementation(async () => Response.json({}, { status }))
    await assert.rejects(checkoutRequest(token), error => error.status === status)
  }
  mock.mock.mockImplementation(async () => Response.json({}, { status: 503 }))
  await assert.rejects(checkoutRequest(token), error => error.status === undefined && /unavailable/.test(error.message))
})

test('proxy forwards only the approved endpoint and never exposes an upstream error body', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ detail: token }, { status: 401 }))
  const result = response()
  await handler({ method: 'POST', query: { operation: 'checkout' }, headers: { authorization: `Bearer ${token}` } }, result)
  const [url, options] = mock.mock.calls[0].arguments
  assert.equal(url.pathname, '/public-onboarding/checkout')
  assert.equal(options.headers.Authorization, `Bearer ${token}`)
  assert.equal(options.redirect, 'error')
  assert.equal(result.code, 401)
  assert.equal(JSON.stringify(result.body).includes(token), false)
})


test('phone entry forwards only the number and notice acceptance without a credential', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'checkout_ready', offer, token }))
  const result = response()
  await handler({ method: 'POST', query: { operation: 'phone' }, headers: {},
    body: { phone: '+14165550123', terms_accepted: true, texting_consent: true, user_id: 'ignored' } }, result)
  const [url, options] = mock.mock.calls[0].arguments
  assert.equal(url.pathname, '/public-onboarding/phone')
  assert.equal(options.headers.Authorization, undefined)
  assert.deepEqual(JSON.parse(options.body), { phone: '+14165550123', terms_accepted: true, texting_consent: true })
  assert.equal(result.code, 200)
})

test('phone entry rejects absent acceptance before contacting the backend', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Must not call') })
  const result = response()
  await handler({ method: 'POST', query: { operation: 'phone' }, headers: {}, body: { phone: '+14165550123' } }, result)
  assert.equal(result.code, 400)
  assert.equal(mock.mock.callCount(), 0)
})

test('public checkout starts without a phone number or personal link', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'checkout', offer, token, client_secret: 'cs_test_public_secret' }))
  assert.equal((await startPublicCheckout()).status, 'checkout')
  const [url, options] = mock.mock.calls[0].arguments
  assert.equal(url, '/api/checkout?operation=entry')
  assert.equal(options.headers.Authorization, undefined)
  assert.equal(options.body, undefined)
})

test('entry proxy accepts no account data and requires a capability for contact acceptance', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'checkout', offer, token }))
  let result = response()
  await handler({ method: 'POST', query: { operation: 'entry' }, headers: {}, body: { phone: 'ignored', user_id: 'ignored' } }, result)
  assert.equal(result.code, 200)
  assert.equal(mock.mock.calls[0].arguments[0].pathname, '/public-onboarding/entry')
  assert.equal(mock.mock.calls[0].arguments[1].body, undefined)
  result = response()
  await handler({ method: 'POST', query: { operation: 'entry-accept' }, headers: {}, body: { phone: '+14165550123', terms_accepted: true, texting_consent: true } }, result)
  assert.equal(result.code, 401)
})
