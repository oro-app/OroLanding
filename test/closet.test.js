import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/closet.js'

function response() {
  return { headers: {}, setHeader(k, v) { this.headers[k] = v },
    status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
}

test('rejects mutation and malformed credentials without contacting backend', async () => {
  for (const [method, authorization, expected] of [['DELETE', '', 405], ['GET', '', 401], ['GET', 'Bearer short', 401]]) {
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
