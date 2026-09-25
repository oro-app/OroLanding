import test from 'node:test'
import assert from 'node:assert/strict'
import { loadFeedbackForm } from '../src/lib/feedbackApi.js'

const token = 'synthetic-feedback-token'
const id = '11111111-1111-4111-8111-111111111111'
const question = { id: 'D7', type: 'rating', prompt: 'Original wording', required: true,
  choices: [{ id: 'much_easier', label: 'Much easier', score: 5 }, { id: 'other', label: 'Other', score: null }],
  show_if: [], allow_comment: true, helper: 'Original helper' }
const followup = { id: 'D5', type: 'text', prompt: 'Original follow-up', required: false,
  choices: [], show_if: [{ question_id: 'D3', choice_ids: ['with_changes'] }], allow_comment: false, helper: null }
const envelope = (overrides = {}) => ({ invitation_id: id, survey_kind: 'daily', survey_version: 1,
  status: 'open', submission_id: null, context: { beta_label: 'Oro beta', local_date: '2026-09-24', timezone: 'America/Toronto' },
  expires_at: '2020-01-01T00:00:00Z', questions: [question, followup], receipt: null, ...overrides })
const respond = (t, body, status = 200, headers = {}) => t.mock.method(globalThis, 'fetch', async () => Response.json(body, { status, headers }))

test('GET preserves every survey envelope and keeps credentials out of the URL and body', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  for (const survey_kind of ['task', 'daily', 'final']) {
    const form = envelope({ survey_kind, context: { ...envelope().context, task_label: 'Your Oro task' } })
    const mock = respond(t, form)
    assert.deepEqual(await loadFeedbackForm(token), { ok: true, form })
    const [url, options] = mock.mock.calls.at(-1).arguments
    assert.equal(url, 'https://api.buildingoro.ca/agent2/beta-feedback/form')
    assert.deepEqual(options, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, signal: options.signal,
      cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error' })
    t.mock.timers.tick(15000)
    assert.equal(options.signal.aborted, false)
  }
})

test('accepted feedback remains readable after expiry and only a matching receipt confirms it', async (t) => {
  for (const status of ['saving', 'submitted']) {
    const receipt = status === 'submitted' ? { submission_id: id, submitted_at: '2026-09-25T01:00:00Z' } : null
    const form = envelope({ status, questions: [], submission_id: id, receipt })
    respond(t, form)
    assert.deepEqual(await loadFeedbackForm(token), { ok: true, form })
  }
})

test('inconsistent or malformed envelopes never look like a usable form or receipt', async (t) => {
  const changes = [{ invitation_id: 'invalid' }, { survey_version: 0 }, { survey_kind: 'unknown' }, { context: {} },
    { expires_at: 'invalid' }, { expires_at: '2026-01-01T00:00:00' }, { questions: [] },
    { status: 'unknown' }, { status: 'saving', submission_id: id },
    { submission_id: id }, { receipt: {} }, { status: 'submitted', questions: [], submission_id: id, receipt: null },
    { status: 'submitted', questions: [], submission_id: id, receipt: { submission_id: 'wrong', submitted_at: '2026-01-01T00:00:00Z' } },
    { status: 'submitted', questions: [], submission_id: id, receipt: { submission_id: id, submitted_at: 'invalid' } }]
  for (const change of changes) {
    respond(t, envelope(change))
    assert.equal((await loadFeedbackForm(token)).code, 'temporarily_unavailable')
  }
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>unavailable</html>'))
  assert.equal((await loadFeedbackForm(token)).ok, false)
  respond(t, envelope(), 202)
  assert.equal((await loadFeedbackForm(token)).ok, false)
})

test('HTTP failures expose only approved codes, with conservative retry delays', async (t) => {
  const errors = [
    [401, 'missing_token'],
    [404, 'invalid_invitation'],
    [404, 'feedback_disabled'],
    [410, 'invitation_expired'],
    [429, 'rate_limited'],
    [500, token],
    [404, 'unknown'],
    [500, 'invalid_invitation'],
  ]
  for (const [status, code] of errors) {
    respond(t, { detail: { code, message: token } }, status)
    assert.deepEqual(await loadFeedbackForm(token), { ok: false,
      code: status === 500 || code === 'unknown' ? 'temporarily_unavailable' : code, retryAfter: 60 })
  }
  t.mock.method(Date, 'now', () => Date.parse('2026-09-25T00:00:00Z'))
  const delays = [
    ['0', 15], ['7', 15], ['120', 120],
    ['Fri, 25 Sep 2026 00:02:00 GMT', 120],
    ['Thu, 24 Sep 2026 00:00:00 GMT', 15],
    ['invalid', 60], ['-1', 60], ['1.5', 60], ['', 60],
  ]
  for (const [header, delay] of delays) {
    respond(t, { detail: { code: 'rate_limited' } }, 429, { 'Retry-After': header })
    assert.equal((await loadFeedbackForm(token)).retryAfter, delay)
  }
})

test('missing credentials and unsafe API configuration send no request', async (t) => {
  const mock = respond(t, envelope())
  for (const credential of [undefined, '', 'token with spaces']) assert.equal((await loadFeedbackForm(credential)).code, 'missing_token')
  for (const apiBase of ['http://api.example.test', 'https://user:password@api.example.test', 'https://api.example.test?query=1', 'https://api.example.test#fragment', 'not a URL']) {
    assert.equal((await loadFeedbackForm(token, { apiBase })).ok, false)
  }
  assert.equal(mock.mock.callCount(), 0)
  await loadFeedbackForm(token, { apiBase: 'https://api.example.test/' })
  assert.equal(mock.mock.calls[0].arguments[0], 'https://api.example.test/agent2/beta-feedback/form')
})

test('network failures, caller cancellation and timeout return safe failures without retrying', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error(token) })
  assert.deepEqual(await loadFeedbackForm(token), { ok: false, code: 'temporarily_unavailable', retryAfter: 60 })
  const waiting = t.mock.method(globalThis, 'fetch', async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error(token)), { once: true })
  }))
  const controller = new AbortController()
  const pending = loadFeedbackForm(token, { signal: controller.signal })
  controller.abort(token)
  assert.equal((await pending).code, 'cancelled')
  assert.equal((await loadFeedbackForm(token, { signal: controller.signal })).code, 'cancelled')
  assert.equal(waiting.mock.callCount(), 1)
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const timedOut = loadFeedbackForm(token)
  t.mock.timers.tick(15000)
  assert.equal((await timedOut).code, 'temporarily_unavailable')
  assert.equal(waiting.mock.callCount(), 2)
})
