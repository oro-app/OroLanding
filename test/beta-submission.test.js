import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import { createBetaHandler } from '../api/_lib/beta-submission.js'
import { canonicalPayload, normalizeAnswers, UUID4 } from '../src/lib/betaContract.js'
import { saveBetaRequest } from '../src/components/beta/betaSubmission.js'
import { exampleAnswers, environment, makeSubmission, googleWriter } from './beta-fixture.js'

async function serve(t, options = {}) {
  const google = googleWriter()
  const handler = createBetaHandler({ env: environment, fetcher: google.fetcher, checkLimit: async () => ({ rateLimited: false }), ...options })
  const server = createServer(async (req, res) => {
    let body = ''
    for await (const part of req) body += part
    req.body = body || undefined
    res.status = (code) => { res.statusCode = code; return res }
    res.json = (value) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)) }
    await handler(req, res)
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  t.after(() => new Promise((resolve) => server.close(resolve)))
  const url = `http://127.0.0.1:${server.address().port}/api/beta-request`
  const post = (body, headers = {}) => fetch(url, { method: 'POST', headers: { origin: 'https://buildingoro.ca', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
  return { ...google, post, url }
}

function envelope(submission = makeSubmission()) {
  const answers = normalizeAnswers(submission.answers).answers
  return { ...submission, answers, cohort: environment.BETA_COHORT, secret: environment.BETA_SUBMISSION_SECRET,
    payload_hash: createHash('sha256').update(canonicalPayload(answers, environment.BETA_COHORT)).digest('hex') }
}

test('HTTP submission saves a literal row with canonical contact details and independent consents', async (t) => {
  const { post, state } = await serve(t)
  const response = await post(makeSubmission())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const receipt = await response.json()
  assert.ok(UUID4.test(receipt.request_id))
  const row = Object.fromEntries(state.rows[0].map((header, index) => [header, state.rows[1][index]]))
  assert.equal(row.request_id, receipt.request_id)
  assert.equal(row.email, 'beta-test@example.com')
  assert.equal(row.phone, '+14165550123')
  assert.equal(row.occasion, '=1+1')
  assert.equal(row.instagram, 'example')
  assert.equal(row.futureBeta, false)
  assert.equal(row.marketing, true)
  assert.equal(row.usualHelpOther, '')
  assert.equal(row.age, '')
  assert.equal(row.gender, '')
  assert.equal(row.form_version, '2026-09-24.1')
  assert.equal(row.consent_recorded_at, row.received_at)
  assert.equal(state.appends[0].options.valueInputOption, 'RAW')
  assert.equal(state.locked, false)
})

test('a lost HTTP acknowledgement is recovered by the browser retry without another row', async (t) => {
  const { post, state } = await serve(t)
  const key = makeSubmission().submission_key
  let attempts = 0
  const browserFetch = async (_url, options) => {
    const response = await post(JSON.parse(options.body))
    if (++attempts === 1) throw new Error('network connection lost after save')
    return response
  }
  assert.equal((await saveBetaRequest(exampleAnswers, key, browserFetch)).code, 'temporarily_unavailable')
  const saved = await saveBetaRequest(exampleAnswers, key, browserFetch)
  assert.equal(saved.requestId, state.rows[1][0])
  assert.equal(state.appendCalls, 1)
})

test('concurrent same-key retries return the original receipt; changed answers conflict', async (t) => {
  const { post, state } = await serve(t)
  const body = makeSubmission()
  const replies = await Promise.all(Array.from({ length: 4 }, async () => (await post(body)).json()))
  assert.equal(new Set(replies.map((reply) => reply.request_id)).size, 1)
  assert.equal(state.appendCalls, 1)
  assert.equal((await post({ ...body, answers: { ...body.answers, hopes: 'Updated' } })).status, 409)
  assert.equal(state.appendCalls, 1)
  assert.equal((await post(makeSubmission({ ...body.answers, hopes: 'Updated' }))).status, 200)
  assert.equal(state.appendCalls, 2)
})

test('optional consent defaults false and hidden follow-ups cannot reach the Sheet', () => {
  const { answers, errors } = normalizeAnswers({ ...exampleAnswers, futureBeta: undefined, marketing: undefined, usualHelpOther: 'x'.repeat(5000) })
  assert.deepEqual(errors, {})
  assert.equal(answers.futureBeta, false)
  assert.equal(answers.marketing, false)
  assert.equal(answers.usualHelpOther, '')
  for (const phone of ['4165550123', '+1 (416) 555-0123', 'tel:4165550123']) assert.equal(normalizeAnswers({ ...exampleAnswers, phone }).answers.phone, '+14165550123')
})

test('malformed answers, phone numbers, stale forms and privileged fields do not write', async (t) => {
  const { post, state } = await serve(t)
  const valid = makeSubmission()
  for (const patch of [
    { phone: '+11111111111' }, { phone: '4165550123 ext. 10' }, { terms: false }, { marketing: 'true' },
    { usedOro: 'Maybe' }, { usualHelp: ['Ask a friend', 'Ask a friend'] }, { usualHelp: 'Ask a friend' },
    { source: 'Other', sourceOther: '' }, { age: '35+' }, { email: 'nope' }, { name: 'x'.repeat(101) }, { approved: true },
  ]) assert.equal((await post({ ...valid, answers: { ...exampleAnswers, ...patch } })).status, 400)
  for (const patch of [{ cohort: 'other' }, { sheet_id: 'other' }, { submission_key: 'bad' }, { form_version: 'old' }, { consent_version: 'old' }, { answers: null }]) assert.equal((await post({ ...valid, ...patch })).status, 400)
  assert.equal((await post({ ...valid, answers: { ...exampleAnswers, week: 'x'.repeat(66000) } })).status, 413)
  assert.equal(state.appendCalls, 0)
})

for (const patch of [{ BETA_SIGNUP_ENABLED: 'false' }, { BETA_SUBMISSION_SECRET: '' }, { BETA_APPS_SCRIPT_URL: 'https://example.com/exec' }, { BETA_RATE_LIMIT_ID: '' }, { VERCEL: '' }, { NODE_ENV: 'development' }]) {
  test(`closed configuration: ${Object.keys(patch)[0]}`, async (t) => {
    const { post, url, state } = await serve(t, { env: { ...environment, ...patch } })
    assert.deepEqual(await (await fetch(url)).json(), { enabled: false })
    assert.equal((await post(makeSubmission())).status, 503)
    assert.equal(state.appendCalls, 0)
  })
}

test('foreign origins and non-JSON bodies are rejected', async (t) => {
  const { post, state } = await serve(t)
  assert.equal((await post(makeSubmission(), { origin: 'https://evil.example' })).status, 403)
  assert.equal((await post(makeSubmission(), { 'content-type': 'text/plain' })).status, 415)
  assert.equal(state.appendCalls, 0)
})

for (const [result, expected] of [[{ rateLimited: true }, 429], [{ rateLimited: false, error: 'not-found' }, 503]]) {
  test(`rate limiter returns ${expected} without writing`, async (t) => {
    const { post, state } = await serve(t, { checkLimit: async () => result })
    assert.equal((await post(makeSubmission())).status, expected)
    assert.equal(state.appendCalls, 0)
  })
}

test('Google ContentService redirect is followed using GET, without the secret', async (t) => {
  const google = googleWriter()
  let receipt, calls = 0
  const fetcher = async (url, options) => {
    calls++
    if (calls === 1) {
      receipt = google.post(JSON.parse(options.body))
      return new Response(null, { status: 302, headers: { location: 'https://script.googleusercontent.com/macros/echo?key=test' } })
    }
    assert.equal(new URL(url).hostname, 'script.googleusercontent.com')
    assert.equal(options.body, undefined)
    assert.equal(options.headers, undefined)
    return Response.json(receipt)
  }
  const { post } = await serve(t, { fetcher })
  assert.equal((await post(makeSubmission())).status, 200)
  assert.equal(calls, 2)
})

for (const fetcher of [
  async () => { throw new Error('timeout') },
  async () => new Response('<html>Login required</html>'),
  async () => Response.json({ ok: false, code: 'unauthorized' }),
  async () => Response.json({ ok: true, request_id: makeSubmission().submission_key, submission_key: 'wrong', payload_hash: 'wrong' }),
  async () => new Response(null, { status: 302, headers: { location: 'https://evil.example' } }),
]) {
  test('an unconfirmed or invalid upstream response never becomes a receipt', async (t) => {
    const { post } = await serve(t, { fetcher })
    assert.equal((await post(makeSubmission())).status, 503)
  })
}

test('Apps Script rejects incorrect secrets, cohorts, hashes and schema drift before writing', () => {
  const google = googleWriter()
  for (const patch of [{ secret: 'wrong' }, { cohort: 'other' }, { payload_hash: 'wrong' }, { approval: true }]) assert.equal(google.post({ ...envelope(), ...patch }).ok, false)
  google.state.rows[0][0] = 'changed header'
  assert.equal(google.post(envelope()).ok, false)
  assert.equal(google.state.appendCalls, 0)
  assert.equal(google.state.locked, false)
})

test('Apps Script recovers a write whose acknowledgement failed and rejects a locked or unconfirmed write', () => {
  const google = googleWriter()
  google.state.throwAfterAppend = true
  assert.equal(google.post(envelope()).ok, true)
  google.state.lockBusy = true
  assert.equal(google.post(envelope()).ok, false)
  assert.equal(google.state.appendCalls, 1)
  google.state.lockBusy = false
  google.state.throwAfterAppend = false
  google.state.dropWrite = true
  assert.equal(google.post(envelope()).ok, false)
  assert.equal(google.state.locked, false)
})
