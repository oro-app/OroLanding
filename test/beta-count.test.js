import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import handler from '../api/beta-count.js'
import { environment, googleWriter } from './beta-fixture.js'

const originalFetch = globalThis.fetch
afterEach(() => { globalThis.fetch = originalFetch })

function response() {
  return { headers: {}, setHeader(name, value) { this.headers[name] = value }, status(code) { this.code = code; return this }, json(body) { this.body = body; return this } }
}

test('the writer counts distinct phones and rejects unauthenticated reads', () => {
  const google = googleWriter()
  assert.equal(google.post({ secret: environment.BETA_SUBMISSION_SECRET, action: 'count' }).count, 0)
  google.state.rows.push(...['+14165550123', '+14165550124', '+14165550123'].map((phone) => google.state.rows[0].map((header) => header === 'phone' ? phone : '')))
  assert.equal(google.post({ secret: environment.BETA_SUBMISSION_SECRET, action: 'count' }).count, 2)
  assert.equal(google.post({ action: 'count' }).code, 'unauthorized')
})

test('the public endpoint returns only the count', async () => {
  const google = googleWriter()
  google.state.rows.push(['first'])
  globalThis.fetch = google.fetcher
  const env = { BETA_APPS_SCRIPT_URL: process.env.BETA_APPS_SCRIPT_URL, BETA_SUBMISSION_SECRET: process.env.BETA_SUBMISSION_SECRET }
  process.env.BETA_APPS_SCRIPT_URL = environment.BETA_APPS_SCRIPT_URL
  process.env.BETA_SUBMISSION_SECRET = environment.BETA_SUBMISSION_SECRET
  try {
    const res = response()
    await handler({ method: 'GET' }, res)
    assert.equal(res.code, 200)
    assert.deepEqual(res.body, { count: 1 })
  } finally {
    for (const [key, value] of Object.entries(env)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
