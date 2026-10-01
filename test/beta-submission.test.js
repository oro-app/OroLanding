import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { createHash, createHmac } from 'node:crypto'
import { createBetaHandler } from '../api/_lib/beta-submission.js'
import { canonicalPayload, FORM_VERSION, normalizeAnswers, UUID4 } from '../src/lib/betaContract.js'
import { saveBetaRequest } from '../src/components/beta/betaSubmission.js'
import { signPhoneProof } from '../api/_lib/beta-phone-proof.js'
import { exampleAnswers, environment, makeSubmission, googleWriter } from './beta-fixture.js'
import { messagesInvite } from '../src/components/beta/referralShare.js'

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
  const post = (body, headers = {}) => fetch(url, { method: 'POST', headers: { origin: 'https://www.askoro.now', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
  return { ...google, post, url }
}

function envelope(submission = makeSubmission()) {
  const answers = normalizeAnswers(submission.answers).answers
  const { phone_verification, ...saved } = submission
  return { ...saved, answers, cohort: environment.BETA_COHORT, secret: environment.BETA_SUBMISSION_SECRET,
    payload_hash: createHash('sha256').update(canonicalPayload(answers, environment.BETA_COHORT, submission.referral_code || '', submission.campaign_source || '')).digest('hex') }
}

test('HTTP submission saves a literal row with canonical contact details and independent consents', async (t) => {
  const { post, state } = await serve(t)
  const response = await post(makeSubmission())
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const receipt = await response.json()
  assert.ok(UUID4.test(receipt.request_id))
  assert.equal(receipt.signup_number, 1)
  const row = Object.fromEntries(state.rows[0].map((header, index) => [header, state.rows[1][index]]))
  assert.equal(row.request_id, receipt.request_id)
  assert.equal(row.email, 'beta-test@example.com')
  assert.equal(row.phone, '+14165550123')
  assert.equal(row.occasion, undefined)
  assert.equal(row.uncertainty, undefined)
  assert.equal(row.instagram, 'example')
  assert.equal(row.futureBeta, false)
  assert.equal(row.marketing, true)
  assert.equal(row.usualHelpOther, '')
  assert.equal(row.age, 'Prefer not to say')
  assert.equal(row.gender, 'Prefer not to say')
  assert.equal(row.form_version, FORM_VERSION)
  assert.equal(row.consent_recorded_at, row.received_at)
  assert.equal(row.referred_signups, 0)
  assert.equal(row.referral_completed_date, '')
  assert.equal(row.accepted, false)
  assert.equal(row.referral_code, createHmac('sha256', environment.BETA_SUBMISSION_SECRET).update(row.phone).digest('hex'))
  assert.equal(row.campaign_source, 'direct')
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
  const proof = signPhoneProof('+14165550123', environment.BETA_SUBMISSION_SECRET)
  assert.equal((await saveBetaRequest(exampleAnswers, key, browserFetch, '', proof)).code, 'temporarily_unavailable')
  const saved = await saveBetaRequest(exampleAnswers, key, browserFetch, '', proof)
  assert.equal(saved.requestId, state.rows[1][0])
  assert.equal(saved.signupNumber, 1)
  assert.equal(state.appendCalls, 1)
})

test('concurrent same-key retries return the original receipt; changed answers conflict', async (t) => {
  const { post, state } = await serve(t)
  const body = makeSubmission()
  const replies = await Promise.all(Array.from({ length: 4 }, async () => (await post(body)).json()))
  assert.equal(new Set(replies.map((reply) => reply.request_id)).size, 1)
  assert.deepEqual(replies.map((reply) => reply.signup_number), [1, 1, 1, 1])
  assert.equal(state.appendCalls, 1)
  assert.equal((await post({ ...body, answers: { ...body.answers, location: 'Updated' } })).status, 409)
  assert.equal(state.appendCalls, 1)
  const next = await post(makeSubmission({ ...body.answers, location: 'Updated' }))
  assert.equal(next.status, 200)
  assert.equal((await next.json()).signup_number, 1)
  assert.equal(state.appendCalls, 2)
  assert.equal((await (await post(body)).json()).signup_number, 1)
})

test('campaign links save validated source separately from self-reported source and referral', async (t) => {
  const { post, state } = await serve(t)
  for (const source of ['reddit-12', 'poster-job', 'ig-angela', 'ig-sunny', 'ig-oro', 'ig-creator-name', 'x-angela', 'x-sunny', 'x-oro', 'x-creator-name', 'linkedin-angela', 'linkedin-sunny', 'linkedin-oro', 'linkedin-creator-name']) {
    const body = makeSubmission({ ...exampleAnswers, phone: `41655501${String(24 + state.appendCalls).padStart(2, '0')}` })
    body.campaign_source = source
    assert.equal((await post(body)).status, 200)
    const row = Object.fromEntries(state.rows[0].map((header, index) => [header, state.rows.at(-1)[index]]))
    assert.equal(row.campaign_source, source)
    assert.equal(row.source, 'Website')
  }
  for (const source of ['reddit-name', 'poster-', 'ig-founder', 'x-company', 'linkedin-founder', 'ig-FounDER', 'tiktok-creator', '=evil', 'linkedin-name/other']) {
    assert.equal((await post({ ...makeSubmission(), campaign_source: source })).status, 400)
  }
  assert.equal(state.appendCalls, 14)
})

test('submission requires a code proof for the same phone number', async (t) => {
  const { post, state } = await serve(t)
  const valid = makeSubmission()
  assert.equal((await post({ ...valid, phone_verification: '' })).status, 400)
  assert.equal((await post({ ...valid, answers: { ...valid.answers, phone: '4165550124' } })).status, 400)
  assert.equal(state.appendCalls, 0)
})

test('three distinct referred phone signups set priority date once', async (t) => {
  const { post, state } = await serve(t)
  const owner = await (await post(makeSubmission())).json()
  const row = (index) => Object.fromEntries(state.rows[0].map((header, column) => [header, state.rows[index][column]]))
  assert.equal(owner.referral_code, row(1).referral_code)
  for (let index = 1; index <= 3; index++) {
    const body = makeSubmission({ ...exampleAnswers, phone: `416555012${index + 3}` })
    body.referral_code = owner.referral_code
    const response = await post(body)
    assert.equal(response.status, 200)
    assert.equal(row(1).referred_signups, index)
    if (index < 3) assert.equal(row(1).referral_completed_date, '')
  }
  const completed = row(1).referral_completed_date
  assert.match(completed, /^\d{4}-\d\d-\d\dT/)
  assert.equal(row(1).accepted, false)
  const repeat = makeSubmission({ ...exampleAnswers, phone: '4165550124', name: 'Another request' })
  repeat.referral_code = owner.referral_code
  assert.equal((await post(repeat)).status, 200)
  assert.equal(row(1).referred_signups, 3)
  assert.equal(row(1).referral_completed_date, completed)
  assert.equal(row(5).referred_by, '')
})

test('self referrals, unknown codes, and retries do not award credit', async (t) => {
  const { post, state } = await serve(t)
  const owner = await (await post(makeSubmission())).json()
  const self = makeSubmission({ ...exampleAnswers, name: 'Second request' })
  self.referral_code = owner.referral_code
  assert.equal((await post(self)).status, 200)
  const unknown = makeSubmission({ ...exampleAnswers, phone: '4165550130' })
  unknown.referral_code = 'a'.repeat(64)
  assert.equal((await post(unknown)).status, 200)
  const referred = makeSubmission({ ...exampleAnswers, phone: '4165550131' })
  referred.referral_code = owner.referral_code
  assert.equal((await post(referred)).status, 200)
  assert.equal((await post(referred)).status, 200)
  assert.equal(state.rows[1][state.rows[0].indexOf('referred_signups')], 1)
  assert.equal(state.rows.length, 5)
  assert.equal((await post({ ...makeSubmission(), referral_code: 'invalid' })).status, 400)
})

test('one visible line orders qualified people by their third referral, then original signup time', () => {
  const google = googleWriter()
  let now = Date.parse('2026-10-01T12:00:00Z')
  google.context.Date = class extends Date { constructor() { super(now++) } }
  const firstRequest = makeSubmission()
  google.post(envelope(firstRequest))
  const save = (phone, ref) => google.post(envelope({ ...makeSubmission({ ...exampleAnswers, phone }), referral_code: ref }))
  const lookup = (phone) => google.post({ secret: environment.BETA_SUBMISSION_SECRET, cohort: environment.BETA_COHORT, action: 'lookup', phone })
  const second = save('+14165550124')
  const third = save('+14165550125')
  for (const phone of ['+14165550126', '+14165550127', '+14165550128']) save(phone, third.referral_code)
  assert.equal(lookup('+14165550125').signup_number, 1)
  assert.equal(lookup('+14165550123').signup_number, 2)
  assert.equal(lookup('+14165550124').signup_number, 3)
  const qualifiedAt = lookup('+14165550125').referral_completed_date
  for (const phone of ['+14165550129', '+14165550130', '+14165550131']) save(phone, second.referral_code)
  assert.equal(lookup('+14165550124').signup_number, 2)
  assert.equal(lookup('+14165550123').signup_number, 3)
  assert.equal(google.post(envelope(firstRequest)).signup_number, 3)
  save('+14165550132', third.referral_code)
  assert.equal(lookup('+14165550125').signup_number, 1)
  assert.equal(lookup('+14165550125').referred_signups, 4)
  assert.equal(lookup('+14165550125').referral_completed_date, qualifiedAt)
  assert.equal(save('+14165550125').signup_number, 1)
  assert.equal(save('+14165550133').signup_number, 11)
  const headers = google.state.rows[0]
  const owner = google.state.rows.find((row) => row[headers.indexOf('phone')] === '+14165550125')
  owner[headers.indexOf('referral_completed_date')] = ''
  owner[headers.indexOf('referred_signups')] = 0
  assert.equal(lookup('+14165550125').referral_completed_date, qualifiedAt)
  assert.equal(lookup('+14165550125').signup_number, 1)
  assert.equal(owner[headers.indexOf('accepted')], false)
})

test('Messages invitations preserve the referral link and desktop falls back to copying', () => {
  const link = 'https://askoro.now/invite?ref=abc&src=ig-sunny'
  for (const [agent, prefix] of [['iPhone', 'sms:&body='], ['Android', 'sms:?body=']]) {
    const uri = messagesInvite(link, agent)
    assert.ok(uri.startsWith(prefix))
    assert.equal(decodeURIComponent(uri.slice(prefix.length)), `thought you'd like oro too :) join me in line: ${link}`)
  }
  assert.equal(messagesInvite(link, 'Macintosh'), '')
  assert.equal(messagesInvite('', 'iPhone'), '')
})

test('browser submission forwards the referral code and receives its own link code', async (t) => {
  const { post } = await serve(t)
  const owner = await (await post(makeSubmission())).json()
  const referralCode = owner.referral_code
  const key = makeSubmission().submission_key
  const browserFetch = (_url, options) => {
    const body = JSON.parse(options.body)
    assert.equal(body.referral_code, referralCode)
    return post(body)
  }
  const saved = await saveBetaRequest({ ...exampleAnswers, phone: '4165550132' }, key, browserFetch, referralCode, signPhoneProof('+14165550132', environment.BETA_SUBMISSION_SECRET))
  assert.ok(UUID4.test(saved.requestId))
  assert.equal(saved.signupNumber, 2)
  assert.match(saved.referralCode, /^[0-9a-f]{64}$/)
})

test('optional and removed answers may be blank while hidden follow-ups cannot reach the Sheet', () => {
  const { answers, errors } = normalizeAnswers({ ...exampleAnswers, challenges: '', hopes: '', week: '', futureBeta: undefined, marketing: undefined, usualHelpOther: 'x'.repeat(5000) })
  assert.deepEqual(errors, {})
  assert.equal(answers.challenges, '')
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
    { source: 'Other', sourceOther: '' }, { age: '35+' }, { email: 'nope' }, { name: 'x'.repeat(101) },
    { occasion: 'Dinner' }, { uncertainty: 'Shoes' }, { approved: true },
  ]) assert.equal((await post({ ...valid, answers: { ...exampleAnswers, ...patch } })).status, 400)
  for (const patch of [{ cohort: 'other' }, { sheet_id: 'other' }, { submission_key: 'bad' }, { form_version: 'old' }, { consent_version: 'old' }, { answers: null }]) assert.equal((await post({ ...valid, ...patch })).status, 400)
  assert.equal((await post({ ...valid, answers: { ...exampleAnswers, location: 'x'.repeat(66000) } })).status, 413)
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

test('verified-phone lookup returns an existing receipt without writing', () => {
  const google = googleWriter()
  assert.equal(google.post(envelope()).ok, true)
  const existing = google.post({ secret: environment.BETA_SUBMISSION_SECRET, cohort: environment.BETA_COHORT, action: 'lookup', phone: '+14165550123' })
  assert.equal(existing.found, true)
  assert.equal(existing.signup_number, 1)
  assert.match(existing.referral_code, /^[0-9a-f]{64}$/)
  assert.equal(existing.referred_signups, 0)
  assert.equal(existing.referral_completed_date, '')
  assert.deepEqual(google.post({ secret: environment.BETA_SUBMISSION_SECRET, cohort: environment.BETA_COHORT, action: 'lookup', phone: '+14165550124' }), { ok: true, found: false })
  assert.equal(google.state.appendCalls, 1)
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

test('existing response sheets can be backfilled with stable referral codes', () => {
  const google = googleWriter()
  assert.equal(google.post(envelope()).ok, true)
  const code = google.state.rows[1][google.state.rows[0].indexOf('referral_code')]
  google.state.rows.forEach((row) => row.splice(-6))
  google.context.setupResponseSheet()
  assert.equal(google.state.rows[1][google.state.rows[0].indexOf('referral_code')], code)
  assert.equal(google.state.rows[1][google.state.rows[0].indexOf('accepted')], false)
  google.context.setupResponseSheet()
  assert.equal(google.state.rows[0].filter((header) => header === 'referral_code').length, 1)
  assert.equal(google.state.rows[1].at(-1), 'unknown')
})

test('existing response sheets get a campaign column with unknown historical sources', () => {
  const google = googleWriter()
  assert.equal(google.post(envelope()).ok, true)
  google.state.rows.forEach((row) => row.pop())
  google.context.setupResponseSheet()
  assert.equal(google.state.rows[0].at(-1), 'campaign_source')
  assert.equal(google.state.rows[1].at(-1), 'unknown')
  google.context.setupResponseSheet()
  assert.equal(google.state.rows[0].filter((header) => header === 'campaign_source').length, 1)
})
