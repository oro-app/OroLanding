import test from 'node:test'
import assert from 'node:assert/strict'
import { createBetaVerificationHandler } from '../api/_lib/beta-verification.js'
import { verifyPhoneProof } from '../api/_lib/beta-phone-proof.js'
import { environment } from './beta-fixture.js'

const env = { ...environment, TWILIO_ACCOUNT_SID: `AC${'a'.repeat(32)}`, TWILIO_AUTH_TOKEN: 'test-token', TWILIO_VERIFY_SERVICE_SID: `VA${'b'.repeat(32)}` }

async function call(body, fetcher) {
  let status = 200
  const headers = {}
  const res = { setHeader(name, value) { headers[name] = value }, status(value) { status = value; return this }, json(value) { return value } }
  const handler = createBetaVerificationHandler({ env, fetcher, checkLimit: async () => ({ rateLimited: false }) })
  const result = await handler({ method: 'POST', headers: { origin: 'https://www.askoro.now', 'content-type': 'application/json' }, body }, res)
  return { status, result, headers }
}

test('SMS code is sent through Verify and approved code returns phone-bound proof', async () => {
  const requests = []
  const fetcher = async (url, options) => {
    requests.push({ url, body: options.body.toString(), authorization: options.headers.Authorization })
    return Response.json({ status: requests.length === 1 ? 'pending' : 'approved' })
  }
  const started = await call({ action: 'start', phone: '(416) 555-0123' }, fetcher)
  assert.deepEqual(started.result, { ok: true })
  const checked = await call({ action: 'check', phone: '(416) 555-0123', code: '123456' }, fetcher)
  assert.equal(checked.status, 200)
  assert.equal(verifyPhoneProof('+14165550123', checked.result.proof, env.BETA_SUBMISSION_SECRET), true)
  assert.equal(verifyPhoneProof('+14165550124', checked.result.proof, env.BETA_SUBMISSION_SECRET), false)
  assert.match(requests[0].body, /To=%2B14165550123&Channel=sms/)
  assert.match(requests[1].body, /Code=123456/)
  assert.ok(requests[0].authorization.startsWith('Basic '))
})

test('invalid code and phone cannot produce a proof', async () => {
  const fetcher = async () => Response.json({ status: 'pending' })
  assert.equal((await call({ action: 'check', phone: '4165550123', code: '123456' }, fetcher)).result.code, 'invalid_code')
  assert.equal((await call({ action: 'start', phone: 'not a phone' }, fetcher)).result.code, 'invalid_phone')
})
