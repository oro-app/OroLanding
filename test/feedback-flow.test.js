import test from 'node:test'
import assert from 'node:assert/strict'
import { createFeedbackFlow } from '../src/lib/feedbackFlow.js'

const token = 'synthetic-invitation'
const id = '11111111-1111-4111-8111-111111111111'
const question = { id: 'F1', type: 'text', prompt: 'Your experience', required: true, allow_comment: false, choices: [], show_if: [] }
const form = (status = 'open', submissionId = id, version = 1) => ({ invitation_id: id, survey_kind: 'final', survey_version: version, status,
  submission_id: status === 'open' ? null : submissionId, context: { beta_label: 'Oro beta' }, expires_at: '2020-01-01T00:00:00Z',
  questions: status === 'open' ? [question] : [], receipt: status === 'submitted' ? { submission_id: submissionId, submitted_at: '2026-09-25T00:00:00Z' } : null })
const settle = () => new Promise(setImmediate)
const rejection = (status, code, question_ids) => Response.json({ detail: { code, question_ids } }, { status })

function setup(t, serve) {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 0 })
  const original = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  const storage = { value: { token }, getItem() { return JSON.stringify(this.value) },
    setItem(_key, value) { this.value = JSON.parse(value) }, removeItem() { this.value = null } }
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage })
  t.after(() => original ? Object.defineProperty(globalThis, 'sessionStorage', original) : delete globalThis.sessionStorage)
  const requests = t.mock.method(globalThis, 'fetch', serve)
  const states = []
  const start = () => {
    const flow = createFeedbackFlow(token, (state) => states.push(state))
    t.after(() => flow.stop())
    flow.resume()
    return flow
  }
  return { storage, states, requests, start, state: () => states.at(-1) }
}

test('drafts persist before sending; confirmed receipt clears all private state', async (t) => {
  const fixture = setup(t, async (url, options) => {
    if (options.method === 'GET') return Response.json(form())
    assert.equal(fixture.storage.value.attempt.body, options.body)
    return Response.json({ submission_id: url.split('/').at(-1), submitted_at: '2026-09-25T00:00:00Z' })
  })
  const flow = fixture.start()
  await settle()
  flow.update({ F1: { text: '  answer  ' } }, 'review')
  assert.equal(fixture.storage.value.draft.F1.text, '  answer  ')
  flow.submit()
  flow.submit()
  await settle()
  assert.equal(fixture.state().status, 'submitted')
  assert.equal(fixture.storage.value, null)
  assert.equal(fixture.requests.mock.callCount(), 2)
  assert.deepEqual(JSON.parse(fixture.requests.mock.calls[1].arguments[1].body), { survey_version: 1, answers: { F1: { text: 'answer' } } })
})

test('lost PUT response survives reload and retries the exact UUID/body only after GET reconciliation', async (t) => {
  const puts = []
  let accepted = false
  const fixture = setup(t, async (url, options) => {
    if (options.method === 'GET') return Response.json(form(accepted ? 'submitted' : 'open', puts.at(-1)?.url.split('/').at(-1)))
    puts.push({ url, body: options.body })
    if (puts.length === 1) throw new Error('lost reply')
    accepted = true
    return Response.json({ status: 'saving', submission_id: url.split('/').at(-1) }, { status: 202 })
  })
  let flow = fixture.start()
  await settle()
  flow.update({ F1: { text: 'answer' } }, 'review')
  flow.submit()
  await settle()
  assert.equal(fixture.state().status, 'reconciling')
  flow.update({ F1: { text: 'changed' } }, 'F1')
  assert.equal(fixture.storage.value.draft.F1.text, 'answer')
  flow.stop()
  flow = fixture.start()
  t.mock.timers.tick(59999)
  await settle()
  assert.equal(fixture.requests.mock.callCount(), 2)
  flow.retry()
  assert.equal(puts.length, 1)
  t.mock.timers.tick(1)
  await settle()
  assert.equal(fixture.state().status, 'retry')
  flow.retry()
  await settle()
  assert.deepEqual(puts[1], puts[0])
  assert.equal(fixture.state().status, 'saving')
  assert.equal(fixture.storage.value.attempt, undefined)
  t.mock.timers.tick(14999)
  await settle()
  assert.equal(fixture.state().status, 'saving')
  t.mock.timers.tick(1)
  await settle()
  assert.equal(fixture.state().status, 'submitted')
})

test('definite validation rejection preserves editable input and safe field errors', async (t) => {
  const fixture = setup(t, async (_url, options) => options.method === 'GET' ? Response.json(form()) : rejection(422, 'invalid_answers', ['F1', 'unknown']))
  const flow = fixture.start()
  await settle()
  flow.update({ F1: { text: 'answer' } }, 'review')
  flow.submit()
  await settle()
  assert.equal(fixture.state().status, 'open')
  assert.deepEqual(Object.keys(fixture.state().errors), ['F1'])
  assert.equal(fixture.storage.value.attempt, undefined)
  flow.update({ F1: { text: 'corrected' } }, 'F1')
  assert.equal(fixture.storage.value.draft.F1.text, 'corrected')
})

test('version rejection reloads the form and requires fresh answers rather than relabeling old ones', async (t) => {
  let version = 1
  const fixture = setup(t, async (_url, options) => {
    if (options.method === 'GET') return Response.json(form('open', id, version))
    version = 2
    return rejection(409, 'survey_version_mismatch')
  })
  const flow = fixture.start()
  await settle()
  flow.update({ F1: { text: 'old' } }, 'review')
  flow.submit()
  await settle()
  t.mock.timers.tick(15000)
  await settle()
  assert.equal(fixture.state().form.survey_version, 2)
  assert.deepEqual(fixture.state().draft, {})
  assert.equal(fixture.state().notice, 'form_changed')
})

test('conflicts never generate another attempt when reconciliation still reports open', async (t) => {
  const fixture = setup(t, async (_url, options) => options.method === 'GET' ? Response.json(form()) : rejection(409, 'submission_id_conflict'))
  const flow = fixture.start()
  await settle()
  flow.update({ F1: { text: 'answer' } }, 'review')
  flow.submit()
  await settle()
  const attempt = fixture.storage.value.attempt
  t.mock.timers.tick(15000)
  await settle()
  assert.equal(fixture.state().status, 'conflict')
  flow.retry()
  flow.submit()
  assert.deepEqual(fixture.storage.value.attempt, attempt)
  assert.equal(fixture.requests.mock.callCount(), 3)
})

test('429 waits for Retry-After and hiding the page pauses reconciliation', async (t) => {
  const fixture = setup(t, async (_url, options) => options.method === 'GET' ? Response.json(form())
    : Response.json({ detail: { code: 'rate_limited' } }, { status: 429, headers: { 'Retry-After': '120' } }))
  const flow = fixture.start()
  await settle()
  flow.update({ F1: { text: 'answer' } }, 'review')
  flow.submit()
  await settle()
  flow.pause()
  t.mock.timers.tick(120000)
  await settle()
  assert.equal(fixture.requests.mock.callCount(), 2)
  flow.resume()
  await settle()
  assert.equal(fixture.state().status, 'retry')
})

test('storage failure prevents PUT; stale responses cannot clear a replacement invitation', async (t) => {
  let resolve
  const fixture = setup(t, async (_url, options) => options.method === 'GET' ? Response.json(form()) : new Promise((done) => { resolve = done }))
  const flow = fixture.start()
  await settle()
  flow.update({ F1: { text: 'answer' } }, 'review')
  const set = fixture.storage.setItem
  fixture.storage.setItem = () => { throw new Error('storage blocked') }
  flow.submit()
  assert.equal(fixture.state().status, 'storage')
  assert.equal(fixture.requests.mock.callCount(), 1)
  fixture.storage.setItem = set
  const next = fixture.start()
  t.mock.timers.tick(15000)
  await settle()
  next.submit()
  const submissionId = fixture.storage.value.attempt.id
  fixture.storage.value = { token: 'replacement' }
  resolve(Response.json({ submission_id: submissionId, submitted_at: '2026-09-25T00:00:00Z' }))
  await settle()
  assert.deepEqual(fixture.storage.value, { token: 'replacement' })
  assert.notEqual(fixture.state().status, 'submitted')
})

test('complete UTF-8 payload limit blocks oversized answers before creating an attempt', async (t) => {
  const data = form()
  data.questions = Array.from({ length: 10 }, (_, index) => ({ ...question, id: `Q${index}` }))
  const fixture = setup(t, async () => Response.json(data))
  const flow = fixture.start()
  await settle()
  flow.update(Object.fromEntries(data.questions.map((item) => [item.id, { text: '😀'.repeat(2000) }])), 'review')
  flow.submit()
  assert.equal(fixture.state().error, 'request_too_large')
  assert.equal(fixture.storage.value.attempt, undefined)
  assert.equal(fixture.requests.mock.callCount(), 1)
})

test('hiding during a write freezes its attempt and reconciles on return', async (t) => {
  const fixture = setup(t, async (_url, options) => {
    if (options.method === 'GET') return Response.json(form())
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
  })
  const flow = fixture.start()
  await settle()
  flow.update({ F1: { text: 'answer' } }, 'review')
  flow.submit()
  const attempt = fixture.storage.value.attempt
  flow.pause()
  await settle()
  t.mock.timers.tick(60000)
  await settle()
  assert.equal(fixture.requests.mock.callCount(), 2)
  assert.deepEqual(fixture.storage.value.attempt, attempt)
  flow.resume()
  await settle()
  assert.equal(fixture.state().status, 'retry')
})
