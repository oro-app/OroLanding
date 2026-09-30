import test from 'node:test'
import assert from 'node:assert/strict'
import { clearBetaDraft, readBetaDraft, writeBetaDraft } from '../src/components/beta/betaDraft.js'
import { emptyAnswers } from '../src/components/beta/betaForm.js'

test('beta draft restores supported answers and retry key, then clears on confirmation', (t) => {
  const originalWindow = globalThis.window
  const originalStorage = globalThis.localStorage
  const values = new Map()
  globalThis.window = {}
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  }
  t.after(() => { globalThis.window = originalWindow; globalThis.localStorage = originalStorage })

  const key = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const answers = { ...emptyAnswers, name: 'Jamie', email: 'jamie@example.com', usualHelp: ['Other'], futureBeta: false }
  writeBetaDraft(answers, key)
  assert.deepEqual(readBetaDraft(), { answers, submissionKey: key })

  const saved = JSON.parse(values.get('oro_beta_request_draft'))
  saved.answers.usualHelp = ['Other', 'Unknown']
  saved.answers.name = 123
  saved.answers.extra = 'ignored'
  saved.submissionKey = 'invalid'
  values.set('oro_beta_request_draft', JSON.stringify(saved))
  assert.deepEqual(readBetaDraft(), {
    answers: { ...answers, name: '', usualHelp: ['Other'] },
    submissionKey: null,
  })

  saved.formVersion = 'outdated'
  values.set('oro_beta_request_draft', JSON.stringify(saved))
  assert.equal(readBetaDraft(), null)
  assert.equal(values.size, 0)

  writeBetaDraft(answers, key)
  clearBetaDraft()
  assert.equal(readBetaDraft(), null)
})
