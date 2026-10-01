import test from 'node:test'
import assert from 'node:assert/strict'
import { createBetaHandler } from '../api/_lib/beta-submission.js'
import { createBetaVerificationHandler } from '../api/_lib/beta-verification.js'
import { createExistingBetaHandler } from '../api/_lib/beta-existing.js'
import { environment } from './beta-fixture.js'

const origins = ['https://www.askoro.now', 'https://oro-landing-git-new-campaign-oro17.vercel.app']
const env = { ...environment, VERCEL_URL: 'protected-build.vercel.app', BETA_ALLOWED_ORIGINS: origins.join(',') }
const handlers = [['submission', createBetaHandler], ['verification', createBetaVerificationHandler], ['lookup', createExistingBetaHandler]]

async function invoke(factory, origin, checkLimit) {
  const req = { method: 'POST', body: {}, headers: {
    origin, host: 'protected-build.vercel.app', 'content-type': 'application/json', 'x-real-ip': '203.0.113.42',
  } }
  const res = { headers: {},
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(body) { this.body = body; return this },
  }
  let fetches = 0
  await factory({ env, checkLimit, fetcher: async () => { fetches++; throw new Error('Unexpected external request') } })(req, res)
  assert.equal(fetches, 0, 'Rate-limit tests must never call Twilio or the signup writer')
  assert.equal(req.headers.host, 'protected-build.vercel.app', 'The original request headers must remain unchanged')
  return res
}

for (const [name, factory] of handlers) {
  for (const origin of origins) test(`${name} checks the approved ${origin} host and preserves the client IP`, async () => {
    const calls = []
    const res = await invoke(factory, origin, async (...args) => { calls.push(args); return { rateLimited: true } })
    assert.deepEqual(calls, [[env.BETA_RATE_LIMIT_ID, { headers: {
      origin, host: new URL(origin).host, 'content-type': 'application/json', 'x-real-ip': '203.0.113.42',
    } }]])
    assert.equal(res.statusCode, 429, 'An allowed origin must reach the rate limiter')
  })

  test(`${name} rejects an unapproved origin before calling the rate limiter`, async () => {
    let calls = 0
    const res = await invoke(factory, 'https://untrusted.example', async () => { calls++; return { rateLimited: false } })
    assert.equal(calls, 0)
    assert.equal(res.statusCode, 403)
    assert.deepEqual(res.body, { code: 'invalid_origin' })
  })

  for (const [mode, checkLimit, status, code] of [
    ['SDK error', async () => ({ error: 'unavailable' }), 503, 'temporarily_unavailable'],
    ['SDK exception', async () => { throw new Error('unavailable') }, 503, 'temporarily_unavailable'],
    ['limited client', async () => ({ rateLimited: true }), 429, 'rate_limited'],
  ]) test(`${name} preserves the ${status} response for ${mode}`, async () => {
    const res = await invoke(factory, origins[0], checkLimit)
    assert.equal(res.statusCode, status)
    assert.deepEqual(res.body, { code })
    assert.equal(res.headers['Retry-After'], status === 429 ? '60' : undefined)
  })
}
