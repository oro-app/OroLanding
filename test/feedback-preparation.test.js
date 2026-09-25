import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { prepareFeedbackAnswers } from '../src/lib/feedbackAnswers.js'
import { validFeedbackQuestions } from '../src/lib/feedbackQuestions.js'

const forms = JSON.parse(readFileSync(new URL('../src/components/feedback/demoForms.json', import.meta.url)))
const base = { id: 'Q', type: 'single', prompt: 'Question', choices: [{ id: 'yes', label: 'Yes', score: null }, { id: 'other', label: 'Other', score: null }],
  required: false, show_if: [], allow_comment: true, helper: null }
const prepare = (answer, changes = {}) => prepareFeedbackAnswers([{ ...base, ...changes }], { Q: answer })

test('approved demo definitions remain valid and preserve explicit rating scores', () => {
  for (const questions of Object.values(forms)) assert.equal(validFeedbackQuestions(questions), true)
  assert.deepEqual(forms.daily.find((question) => question.id === 'D7').choices.slice(0, 5).map((choice) => choice.score), [5, 4, 3, 2, 1])
  assert.equal(forms.daily.some((question) => ['D1', 'D2', 'D14'].includes(question.id)), false)
})

test('malformed definitions, references, duplicates and cycles fail closed', () => {
  for (const change of [{ type: 'unknown' }, { id: '__proto__' }, { required: null }, { allow_comment: 'yes' }, { prompt: '' },
    { choices: [] }, { choices: [{ id: 'yes', label: 'Yes', score: '1' }] }, { choices: [base.choices[0], base.choices[0]] },
    { show_if: [{ question_id: 'absent', choice_ids: ['yes'] }] }, { show_if: [{ question_id: 'Q', choice_ids: ['yes'] }] }]) {
    assert.equal(validFeedbackQuestions([{ ...base, ...change }]), false)
  }
  assert.equal(validFeedbackQuestions([base, base]), false)
  assert.equal(validFeedbackQuestions(null), false)
})

test('optional blanks are omitted while visible required answers report their field', () => {
  for (const value of [undefined, {}, { choice: '' }, { choice: null }]) assert.deepEqual(prepare(value), { answers: {}, errors: {} })
  assert.equal(prepare({}, { required: true }).errors.Q.field, 'choice')
  assert.deepEqual(prepare({ text: '  \n ' }, { type: 'text', choices: [] }).answers, {})
  assert.equal(prepare({ text: '  ' }, { type: 'text', choices: [], required: true }).errors.Q.field, 'text')
  for (const choice of [0, false, [], 'unknown']) assert.equal(prepare({ choice }).errors.Q.field, 'choice')
  for (const value of [null, [], 'not an object']) assert.ok(prepare(value).errors.Q)
})

test('Other and allowed comments trim at serialization without changing the draft', () => {
  const draft = { choice: 'other', other_text: '  detail  ', comment: '  explanation  ', score: 5, token: 'discard' }
  assert.deepEqual(prepare(draft), { answers: { Q: { choice: 'other', other_text: 'detail', comment: 'explanation' } }, errors: {} })
  assert.equal(draft.other_text, '  detail  ')
  assert.equal(prepare({ choice: 'other', other_text: ' ' }).errors.Q.field, 'other_text')
  assert.deepEqual(prepare({ choice: 'yes', other_text: 'stale', comment: '  ' }).answers, { Q: { choice: 'yes' } })
  assert.deepEqual(prepare({ choice: 'yes', comment: 'not allowed' }, { allow_comment: false }).answers, { Q: { choice: 'yes' } })
  assert.equal(prepare({ choice: 'yes', comment: 42 }).errors.Q.field, 'comment')
  assert.equal(prepare({ comment: 'Keep this explanation' }).errors.Q.field, 'choice')
})

test('checklists reject duplicates and unknown IDs, and sort a copy with Other', () => {
  const draft = { choices: ['yes', 'other'], other_text: '  detail  ' }
  assert.deepEqual(prepare(draft, { type: 'multiple' }).answers, { Q: { choices: ['other', 'yes'], other_text: 'detail' } })
  assert.deepEqual(draft.choices, ['yes', 'other'])
  for (const choices of ['yes', ['yes', 'yes'], ['unknown'], [42]]) assert.ok(prepare({ choices }, { type: 'multiple' }).errors.Q)
  assert.deepEqual(prepare({ choices: [] }, { type: 'multiple' }).answers, {})
  assert.ok(prepare({ choices: [] }, { type: 'multiple', required: true }).errors.Q)
})

test('text boundaries use Unicode code points after trimming for every written field', () => {
  for (const field of ['text', 'other_text', 'comment']) {
    const changes = field === 'text' ? { type: 'text', choices: [] } : {}
    for (const character of ['a', '😀']) {
      const answer = { choice: field === 'other_text' ? 'other' : 'yes', [field]: ` ${character.repeat(2000)} ` }
      assert.deepEqual(prepare(answer, changes).errors, {})
      assert.equal(prepare({ ...answer, [field]: character.repeat(2001) }, changes).errors.Q.field, field)
    }
  }
})

test('daily and final branches omit inactive answers and require Depends text', () => {
  const daily = prepareFeedbackAnswers(forms.daily, { D3: { choice: 'as_suggested' }, D6: { choice: 'other' }, D7: { choice: 'much_easier', score: 1 } })
  assert.deepEqual(daily, { answers: { D3: { choice: 'as_suggested' }, D7: { choice: 'much_easier' } }, errors: {} })
  const final = prepareFeedbackAnswers(forms.final, { F9: { choice: 'completely' }, F12: { choice: 'fully' }, F17: { choice: 'depends' }, F19: { text: 'stale' } })
  assert.deepEqual(Object.keys(final.errors), ['F17_depends'])
  assert.equal(Object.hasOwn(final.answers, 'F19'), false)
})
