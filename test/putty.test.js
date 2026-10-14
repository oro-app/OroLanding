import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cents, clearPuttyDraft, hoodieSpots, puttyCheckoutUrl, puttyPriceHue, puttyPublicUrl, puttyRequest, puttySpotUrl, readPuttyDraft, readPuttyOrder, refreshPuttySelection, savePuttyDraft, validPuttyResponse } from '../src/lib/putty.js'

test('all placements render before the API responds, without pretending they are available', () => {
  const spots = hoodieSpots(null)
  assert.equal(spots.length, 49)
  assert.equal(new Set(spots.map(spot => spot.id)).size, 49)
  assert.equal(spots[0].id, 'front')
  assert.equal(spots[1].id, 'A1')
  assert.equal(spots[48].id, 'H6')
  assert.ok(spots.every(spot => spot.unknown && spot.minimum === undefined))
  const live = hoodieSpots({ spots: [{ id: 'A1', name: 'Alex', total: 1000, minimum: 1100, held: true }] })
  assert.equal(live[1].name, 'Alex')
  assert.equal(live[1].minimum, 1100)
  assert.equal(live[1].held, true)
  assert.equal(live[2].unknown, true)
})

test('money is parsed into exact integer cents without rounding an invalid bid', () => {
  assert.equal(cents('10'), 1000)
  assert.equal(cents('500.01'), 50001)
  assert.equal(cents('10.1'), 1010)
  for (const invalid of ['1.001', '-10', '1e3', '', 'Infinity', '1000000']) assert.equal(cents(invalid), null)
})

test('a refreshed board removes held choices and raises stale bids to the latest minimum', () => {
  const selected = refreshPuttySelection({ A1: '10.00', A2: '20.00', A3: '30.00' }, [
    { id: 'A1', minimum: 1250, held: false },
    { id: 'A2', minimum: 1000, held: false },
    { id: 'A3', minimum: 3100, held: true },
  ])
  assert.deepEqual(selected, { A1: '12.50', A2: '20.00' })
})

test('placement price colors run from green at ten dollars to red at the board maximum', () => {
  const spots = [{ minimum: 1000 }, { minimum: 25500 }, { minimum: 50000 }]
  assert.equal(puttyPriceHue(spots[0], spots), 120)
  assert.equal(puttyPriceHue(spots[2], spots), 0)
})

test('backend conflict remains a conflict and never becomes a local claim', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ detail: 'A square is held.' }) })
  try { await assert.rejects(puttyRequest('checkout', {}), error => error.status === 409 && error.message === 'A square is held.') }
  finally { globalThis.fetch = original }
})

test('merch API responses are validated before the checkout trusts them', async () => {
  const order = { order_id: '17110941-5e75-4ac7-9945-3e65f280d6b1', status: 'pending', amount: 1000,
    currency: 'usd', hold_until: '2026-10-13T16:03:00Z', items: [{ spot_id: 'A1', total: 1000, credit: 0, due: 1000 }],
    checkout_url: 'https://checkout.stripe.com/c/pay/test' }
  assert.equal(validPuttyResponse('checkout', order), true)
  assert.equal(validPuttyResponse('status', { ...order, amount: '1000' }), false)
  assert.equal(validPuttyResponse('checkout', { ...order, checkout_url: 'https://example.com/pay' }), false)
  assert.equal(validPuttyResponse('checkout', { ...order, checkout_url: null, client_secret: 'cs_test_legacy' }), false)

  const original = globalThis.fetch
  globalThis.fetch = async () => Response.json({ ...order, currency: 'cad' })
  try { await assert.rejects(puttyRequest('checkout', {}), /verify the checkout response/) }
  finally { globalThis.fetch = original }
})

test('board responses validate placement ids from the board contract', () => {
  const spots = hoodieSpots(null).map(({ id }) => ({ id, name: null, total: 0, minimum: id === 'front' ? 50000 : 1000, held: false }))
  const board = { currency: 'usd', enabled: true, leaderboard: [{ name: 'Oro', area: 1, total_paid: 1000, url: 'https://example.com' }], spots }

  assert.equal(validPuttyResponse('board', board), true)
  assert.equal(validPuttyResponse('board', { ...board, leaderboard: [{ name: 'Graypass', area: 0, total_paid: 1000 }] }), true)
  assert.equal(validPuttyResponse('board', { ...board, leaderboard: [{ name: 'Oro', area: 1, total_paid: 1000 }] }), true)
  assert.equal(validPuttyResponse('board', { ...board, leaderboard: [{ name: 'Oro', area: -1, total_paid: 1000 }] }), false)
  for (const total_paid of [-1, '1000', 1.5]) {
    assert.equal(validPuttyResponse('board', { ...board, leaderboard: [{ name: 'Oro', area: 1, total_paid }] }), false)
  }
  assert.equal(validPuttyResponse('board', { ...board, leaderboard: [{ ...board.leaderboard[0], url: 'javascript:alert(1)' }] }), false)
  assert.equal(validPuttyResponse('board', { ...board, spots: spots.map(spot => ({ ...spot, spot_id: spot.id, id: undefined })) }), false)
})

test('public merch links only accept HTTPS URLs', () => {
  assert.equal(puttyPublicUrl('https://example.com/image.png'), 'https://example.com/image.png')
  assert.equal(puttyPublicUrl('javascript:alert(1)'), '')
  assert.equal(puttySpotUrl({ name: 'Oro' }, [{ name: 'Oro', url: 'https://example.com' }]), 'https://example.com/')
  assert.equal(puttySpotUrl({ name: 'Oro' }, [{ name: 'Oro', url: 'javascript:alert(1)' }]), '')
  assert.equal(puttySpotUrl({ name: 'Oro' }, [{ name: 'Oro', url: 'https://one.example' }, { name: 'Oro', url: 'https://two.example' }]), '')
})

test('merch checkout only follows Stripe hosted payment URLs', () => {
  assert.equal(puttyCheckoutUrl('https://checkout.stripe.com/c/pay/test'), 'https://checkout.stripe.com/c/pay/test')
  for (const value of ['https://example.com/checkout', 'http://checkout.stripe.com/test', 'not a url']) {
    assert.equal(puttyCheckoutUrl(value), '')
  }
})

test('server rendering does not require browser checkout storage', () => {
  assert.equal(readPuttyOrder(), null)
})

test('hoodie choices persist for the browser session until explicitly cleared', () => {
  const values = new Map()
  globalThis.window = {}
  globalThis.sessionStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  }
  try {
    const draft = { selected: { A1: '20.00', front: '500.00' }, email: 'oro@example.com', name: 'Oro', consent: true }
    savePuttyDraft(draft)
    assert.deepEqual(readPuttyDraft(), draft)
    clearPuttyDraft()
    assert.deepEqual(readPuttyDraft(), { selected: {}, email: '', name: '', consent: false })
  } finally {
    delete globalThis.window
    delete globalThis.sessionStorage
  }
})
