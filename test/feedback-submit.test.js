import test from 'node:test'
import assert from 'node:assert/strict'
import { saveFeedback, MAX_FEEDBACK_BYTES } from '../src/lib/feedbackApi.js'

const token = 'synthetic-token'
const id = '11111111-1111-4111-8111-111111111111'
const body = JSON.stringify({ survey_version: 1, answers: { D7: { choice: 'same' } } })

test('PUT sends the exact frozen body privately and distinguishes acceptance from a receipt', async (t) => {
  for (const [status, response, expected] of [
    [202, { status: 'saving', submission_id: id }, 'saving'],
    [200, { submission_id: id, submitted_at: '2026-09-25T00:00:00Z' }, 'submitted'],
  ]) {
    const request = t.mock.method(globalThis, 'fetch', async () => Response.json(response, { status }))
    assert.equal((await saveFeedback(token, id, body)).status, expected)
    const [url, options] = request.mock.calls[0].arguments
    assert.equal(url, `https://api.buildingoro.ca/agent2/beta-feedback/submissions/${id}`)
    assert.equal(options.method, 'PUT')
    assert.equal(options.body, body)
    assert.deepEqual(options.headers, { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' })
    assert.equal(options.credentials, 'omit')
    assert.equal(options.cache, 'no-store')
    assert.equal(options.referrerPolicy, 'no-referrer')
    assert.equal(options.redirect, 'error')
  }
})

test('malformed acceptance or receipts never confirm a write', async (t) => {
  for (const [status, response] of [[200, { status: 'submitted' }], [202, { status: 'saving', submission_id: 'wrong' }],
    [200, { submission_id: id, submitted_at: 'invalid' }], [201, { submission_id: id, submitted_at: '2026-09-25T00:00:00Z' }]]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json(response, { status }))
    assert.equal((await saveFeedback(token, id, body)).code, 'temporarily_unavailable')
  }
})

test('recognized rejections expose only safe codes and question IDs', async (t) => {
  for (const [status, code] of [[409, 'already_submitted'], [409, 'submission_id_conflict'], [409, 'survey_version_mismatch'],
    [413, 'request_too_large'], [422, 'invalid_answers'], [429, 'rate_limited']]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json({ detail: { code, message: token, question_ids: ['D7', '<private>', 42] } },
      { status, headers: { 'Retry-After': '120' } }))
    const result = await saveFeedback(token, id, body)
    assert.equal(result.code, code)
    assert.equal(result.retryAfter, 120)
    assert.equal(JSON.stringify(result).includes(token), false)
    if (status === 422) assert.deepEqual(result.questionIds, ['D7'])
  }
})

test('UTF-8 body size and UUID are checked before sending; timeout remains uncertain', async (t) => {
  const request = t.mock.method(globalThis, 'fetch', async () => Response.json({ status: 'saving', submission_id: id }, { status: 202 }))
  assert.equal((await saveFeedback(token, 'bad/id', body)).code, 'invalid_answers')
  assert.equal((await saveFeedback(token, id, '😀'.repeat(MAX_FEEDBACK_BYTES / 4 + 1))).code, 'request_too_large')
  assert.equal(request.mock.callCount(), 0)
  assert.equal((await saveFeedback(token, id, 'x'.repeat(MAX_FEEDBACK_BYTES))).status, 'saving')
  t.mock.timers.enable({ apis: ['setTimeout'] })
  t.mock.method(globalThis, 'fetch', (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })
  }))
  const result = saveFeedback(token, id, body)
  t.mock.timers.tick(15000)
  assert.equal((await result).code, 'temporarily_unavailable')
})
