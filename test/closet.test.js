import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/closet.js'

function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v },
    status(code) { this.code = code; return this }, json(body) { this.body = body; return this }, end() { return this } }
}

test('rejects unsupported methods and malformed credentials without contacting backend', async () => {
  for (const [method, authorization, expected] of [['POST', '', 405], ['GET', '', 401], ['GET', 'Bearer short', 401]]) {
    const res = response()
    await handler({ method, headers: { authorization }, query: {} }, res)
    assert.equal(res.code, expected)
    assert.equal(res.headers['Cache-Control'], 'no-store')
  }
})

test('forwards only bearer header to fixed read endpoint, preserving expiry errors', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url.pathname, '/closet-link')
    assert.equal(url.hash, '')
    assert.equal(url.search, '')
    assert.equal(options.headers.Authorization, `Bearer ${'a'.repeat(43)}`)
    assert.equal(options.redirect, 'error')
    return { ok: false, status: 401, headers: new Headers() }
  })
  const res = response()
  await handler({ method: 'GET', headers: { authorization: `Bearer ${'a'.repeat(43)}` }, query: { user_id: 'other' } }, res)
  assert.equal(res.code, 401)
  assert.equal(res.headers['Referrer-Policy'], 'no-referrer')
})

test('backend outage returns generic error without credential', async t => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('secret') })
  const res = response()
  await handler({ method: 'GET', headers: { authorization: `Bearer ${'a'.repeat(43)}` } }, res)
  assert.equal(res.code, 503)
  assert.equal(JSON.stringify(res.body).includes('secret'), false)
})

for (const method of ['PATCH', 'DELETE']) {
  test(`${method} forwards only the item ID, token, and allowed title`, async t => {
    const id = '12345678-1234-1234-1234-123456789abc'
    t.mock.method(globalThis, 'fetch', async (url, options) => {
      assert.equal(url.pathname, `/closet-link/items/${id}`)
      assert.equal(url.search, '')
      assert.equal(options.method, method)
      assert.equal(options.headers.Authorization, `Bearer ${'a'.repeat(43)}`)
      assert.equal(options.body, method === 'PATCH' ? '{"title":"New title"}' : undefined)
      return { ok: true, status: method === 'DELETE' ? 204 : 200, headers: new Headers(), json: async () => ({ id, title: 'New title' }) }
    })
    const res = response()
    await handler({ method, headers: { authorization: `Bearer ${'a'.repeat(43)}` }, query: { item_id: id, user_id: 'other' }, body: { title: ' New title ' } }, res)
    assert.equal(res.code, method === 'DELETE' ? 204 : 200)
  })
}

test('invalid IDs and title updates never reach upstream', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('Unexpected fetch') })
  for (const [id, body] of [['../other', { title: 'Title' }], ['12345678-1234-1234-1234-123456789abc', { title: ' ' }], ['12345678-1234-1234-1234-123456789abc', { title: 'x'.repeat(201) }], ['12345678-1234-1234-1234-123456789abc', { title: 'Title', user_id: 'other' }]]) {
    const res = response()
    await handler({ method: 'PATCH', headers: { authorization: `Bearer ${'a'.repeat(43)}` }, query: { item_id: id }, body }, res)
    assert.equal(res.code, 400)
  }
  assert.equal(fetch.mock.callCount(), 0)
})
