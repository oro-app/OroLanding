import test from 'node:test'
import assert from 'node:assert/strict'
import { createFeedbackReader } from '../src/lib/feedbackReader.js'

const token = 'synthetic-invitation'
const id = '11111111-1111-4111-8111-111111111111'
const settle = () => new Promise(setImmediate)
const form = (status) => ({ invitation_id: id, survey_kind: 'final', survey_version: 1, status,
  submission_id: status === 'open' ? null : id, context: { beta_label: 'Oro beta' }, expires_at: '2020-01-01T00:00:00Z',
  questions: status === 'open' ? [{ id: 'F1', type: 'text', prompt: 'Your experience', choices: [], show_if: [] }] : [],
  receipt: status === 'submitted' ? { submission_id: id, submitted_at: '2026-09-25T00:00:00Z' } : null })

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
    const reader = createFeedbackReader(token, (state) => states.push(state))
    t.after(() => reader.stop())
    reader.resume()
    return reader
  }
  return { storage, requests, states, start }
}

test('saving polls after 15 seconds, confirms once, and clears the credential', async (t) => {
  let count = 0
  const { start, requests, states, storage } = setup(t, async () => Response.json(form(++count === 1 ? 'saving' : 'submitted')))
  const reader = start()
  reader.resume()
  await settle()
  assert.equal(states[0].status, 'saving')
  assert.equal(storage.value.token, token)
  reader.pause()
  reader.resume()
  reader.resume()
  t.mock.timers.tick(14999)
  await settle()
  assert.equal(requests.mock.callCount(), 1)
  t.mock.timers.tick(1)
  await settle()
  assert.deepEqual(states[1], { status: 'submitted', form: form('submitted') })
  assert.equal(storage.value, null)
  reader.resume()
  t.mock.timers.tick(60000)
  assert.equal(requests.mock.callCount(), 2)
})

test('Retry-After survives a new reader and network failures increase the backoff', async (t) => {
  let count = 0
  const { start, requests, states, storage } = setup(t, async () => {
    if (++count > 1) throw new Error(token)
    return Response.json({ detail: { code: 'rate_limited' } }, { status: 429, headers: { 'Retry-After': '90' } })
  })
  const reader = start()
  await settle()
  assert.equal(storage.value.nextCheckAt, 90000)
  reader.stop()
  start()
  t.mock.timers.tick(89999)
  await settle()
  assert.equal(requests.mock.callCount(), 1)
  t.mock.timers.tick(1)
  await settle()
  assert.equal(states.at(-1).status, 'temporarily_unavailable')
  assert.equal(storage.value.nextCheckAt, 150000)
  t.mock.timers.tick(60000)
  await settle()
  assert.equal(storage.value.nextCheckAt, 270000)
})

for (const action of ['pause', 'stop', 'replace']) {
  test(`${action} prevents a late receipt from clearing or updating the invitation`, async (t) => {
    let finish
    const { start, requests, states, storage } = setup(t, () => new Promise((resolve) => { finish = resolve }))
    const reader = start()
    reader.resume()
    assert.equal(requests.mock.callCount(), 1)
    if (action === 'replace') storage.value = { token: 'another-invitation' }
    else reader[action]()
    finish(Response.json(form('submitted')))
    await settle()
    assert.deepEqual(states, [])
    assert.equal(storage.value.token, action === 'replace' ? 'another-invitation' : token)
    assert.equal(requests.mock.calls[0].arguments[1].signal.aborted, action !== 'replace')
  })
}

test('open and disabled states retain the invitation; terminal errors clear it', async (t) => {
  let reply
  const { start, states, storage, requests } = setup(t, async () => reply)
  const cases = [[200, 'open'], [404, 'feedback_disabled'], [401, 'missing_token'], [404, 'invalid_invitation'], [410, 'invitation_expired']]
  for (const [index, [status, code]] of cases.entries()) {
    storage.value = { token }
    reply = Response.json(status === 200 ? form('open') : { detail: { code } }, { status })
    const reader = start()
    await settle()
    assert.equal(states.at(-1).status, code)
    assert.equal(storage.value?.token ?? null, ['open', 'feedback_disabled'].includes(code) ? token : null)
    t.mock.timers.tick(60000)
    await settle()
    assert.equal(requests.mock.callCount(), index + 1)
    reader.stop()
  }
  t.mock.timers.tick(60000)
  assert.equal(requests.mock.callCount(), cases.length)
})

test('unavailable session storage stops requests and emits only recovery status', async (t) => {
  const { start, states, storage, requests } = setup(t, async () => Response.json(form('saving')))
  storage.setItem = () => { throw new Error(token) }
  start()
  await settle()
  assert.deepEqual(states, [{ status: 'storage' }])
  assert.equal(requests.mock.callCount(), 0)
})
