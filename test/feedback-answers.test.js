import test from 'node:test'
import assert from 'node:assert/strict'
import { pruneFeedbackDraft } from '../src/lib/feedbackAnswers.js'

const rule = (question_id, ...choice_ids) => ({ question_id, choice_ids })
const question = (id, type = 'single', options = ['yes', 'no', 'depends'], extra = {}) => ({
  id, type, prompt: `Question ${id}`, required: false, helper: null, allow_comment: false,
  choices: options.map((id) => ({ id, label: id, score: null })), show_if: [], ...extra,
})
const daily = [
  question('D3', 'single', ['exactly', 'with_changes', 'no']),
  question('D5', 'text', [], { show_if: [rule('D3', 'with_changes')] }),
  question('D6', 'single', ['planned_for_later', 'other'], { required: true, show_if: [rule('D3', 'no')] }),
  question('D7', 'rating', [], { required: true, choices: [
    { id: 'much_easier', label: 'Much easier', score: 5 }, { id: 'much_harder', label: 'Much harder', score: 1 },
  ] }),
]
const final = [
  question('F17', 'single', undefined, { required: true, allow_comment: true }),
  question('F17_depends', 'text', [], { required: true, show_if: [rule('F17', 'depends')] }),
  question('F19', 'text', [], { show_if: [rule('F17', 'no')] }),
  question('F21'),
  question('F21_reasons', 'multiple', ['price', 'other'], {
    allow_comment: true, show_if: [rule('F21', 'yes', 'no', 'depends')],
  }),
]
const ids = (result) => result.questions.map(({ id }) => id)

test('daily branches clear inactive answers and do not restore them when changing back', () => {
  const draft = { D3: { choice: 'no' }, D5: { text: '  changed shoes  ' },
    D6: { choice: 'other', other_text: '  reason  ' }, D7: { choice: 'much_easier' }, unknown: { text: 'discard' } }
  for (const [choice, followup] of [['exactly', []], ['with_changes', ['D5']], ['no', ['D6']]]) {
    const result = pruneFeedbackDraft(daily, { ...draft, D3: { choice } })
    assert.deepEqual(ids(result), ['D3', ...followup, 'D7'])
    assert.deepEqual(Object.keys(result.answers), ['D3', ...followup, 'D7'])
  }
  const pruned = pruneFeedbackDraft(daily, draft).answers
  assert.deepEqual(pruneFeedbackDraft(daily, { ...pruned, D3: { choice: 'with_changes' } }).answers,
    { D3: { choice: 'with_changes' }, D7: { choice: 'much_easier' } })
})

test('final follow-ups follow Yes/No/Depends and clearing the optional payment answer', () => {
  for (const [choice, followup] of [['yes', []], ['no', ['F19']], ['depends', ['F17_depends']]]) {
    const result = pruneFeedbackDraft(final, { F17: { choice }, F21: { choice },
      F17_depends: { text: 'conditions' }, F19: { text: 'alternative' }, F21_reasons: { choices: ['price'] } })
    assert.deepEqual(ids(result), ['F17', ...followup, 'F21', 'F21_reasons'])
    const cleared = pruneFeedbackDraft(final, { ...result.answers, F21: { choice: '' } })
    assert.equal(Object.hasOwn(cleared.answers, 'F21_reasons'), false)
    assert.equal(Object.hasOwn(pruneFeedbackDraft(final, { ...cleared.answers, F21: { choice } }).answers, 'F21_reasons'), false)
  }
})

test('missing, unsupported and malformed controllers cannot reveal follow-ups', () => {
  for (const answer of [undefined, null, 'no', ['no'], {}, { choice: '' }, { choice: 'unknown' }, { choices: ['no'] }]) {
    assert.deepEqual(ids(pruneFeedbackDraft(daily, { D3: answer, D6: { choice: 'other' } })), ['D3', 'D7'])
  }
  for (const draft of [undefined, null, [], 'invalid']) assert.deepEqual(pruneFeedbackDraft(daily, draft).answers, {})
})

test('all conditions must match a valid single selection, including rating controllers', () => {
  const questions = [...daily, question('followup', 'text', [], { show_if: [rule('D3', 'no'), rule('D7', 'much_harder')] })]
  for (const [choice, rating, visible] of [['no', 'much_harder', true], ['exactly', 'much_harder', false], ['no', 'much_easier', false]]) {
    assert.equal(ids(pruneFeedbackDraft(questions, { D3: { choice }, D7: { choice: rating } })).includes('followup'), visible)
  }
  const checklist = [question('parent', 'multiple'), question('child', 'text', [], { show_if: [rule('parent', 'yes')] })]
  assert.deepEqual(ids(pruneFeedbackDraft(checklist, { parent: { choices: ['yes'], choice: 'yes' } })), ['parent'])
})

test('hidden or missing controllers and cyclic rules do not preserve stale descendants', () => {
  const questions = [question('child', 'text', [], { show_if: [rule('parent', 'yes')] }),
    question('parent', 'single', undefined, { show_if: [rule('root', 'yes')] }), question('root')]
  const draft = { root: { choice: 'no' }, parent: { choice: 'yes' }, child: { text: 'stale' } }
  assert.deepEqual(pruneFeedbackDraft(questions, draft).answers, { root: { choice: 'no' } })
  assert.deepEqual(ids(pruneFeedbackDraft(questions, { ...draft, root: { choice: 'yes' } })), ['child', 'parent', 'root'])
  assert.deepEqual(ids(pruneFeedbackDraft(questions.slice(0, 2), draft)), [])
  const cycle = [question('a', 'single', undefined, { show_if: [rule('b', 'yes')] }),
    question('b', 'single', undefined, { show_if: [rule('a', 'yes')] })]
  assert.deepEqual(pruneFeedbackDraft(cycle, { a: { choice: 'yes' }, b: { choice: 'yes' } }).answers, {})
})

test('draft pruning preserves unfinished text but removes inactive explanation fields', () => {
  const draft = { F17: { choice: 'depends', comment: 'x'.repeat(2001), other_text: 'stale' },
    F17_depends: { text: '  unfinished  ', comment: 'not allowed' }, F21: { choice: 'yes', comment: 'not allowed' },
    F21_reasons: { choices: ['price', 'other'], other_text: ' ', comment: '  explanation  ', score: 99 } }
  const result = pruneFeedbackDraft(final, draft)
  assert.deepEqual(result.answers.F17, { choice: 'depends', comment: draft.F17.comment })
  assert.deepEqual(result.answers.F17_depends, { text: '  unfinished  ' })
  assert.deepEqual(result.answers.F21, { choice: 'yes' })
  assert.deepEqual(result.answers.F21_reasons, { choices: ['price', 'other'], other_text: ' ', comment: '  explanation  ' })
  for (const choices of [[], ['price']]) {
    assert.deepEqual(pruneFeedbackDraft(final, { ...draft, F21_reasons: { ...draft.F21_reasons, choices } }).answers.F21_reasons,
      { choices, comment: '  explanation  ' })
  }
  assert.deepEqual(pruneFeedbackDraft(daily, { D3: { choice: 'no' }, D6: { choice: 'planned_for_later', other_text: 'stale' } }).answers.D6,
    { choice: 'planned_for_later' })
})

test('pruning preserves definitions, choice IDs, invalid editable values and caller input', () => {
  const draft = { D3: { choice: 'with_changes' }, D5: { text: 42 }, D7: { choice: 'much_easier', score: 5, label: 'Much easier' } }
  const before = structuredClone({ daily, draft })
  const result = pruneFeedbackDraft(daily, draft)
  assert.deepEqual(result.answers, { D3: { choice: 'with_changes' }, D5: { text: 42 }, D7: { choice: 'much_easier' } })
  assert.equal(result.questions[0], daily[0])
  assert.equal(result.questions.at(-1), daily.at(-1))
  result.answers.D3.choice = 'no'
  assert.deepEqual({ daily, draft }, before)
  const multiple = { F21: { choice: 'yes' }, F21_reasons: { choices: ['other', 'price'], other_text: '' } }
  const copied = pruneFeedbackDraft(final, multiple).answers
  copied.F21_reasons.choices.pop()
  assert.deepEqual(multiple.F21_reasons.choices, ['other', 'price'])
  for (const answer of [null, 'invalid', [], { choices: 'invalid' }]) {
    assert.deepEqual(pruneFeedbackDraft(final, { F21: { choice: 'yes' }, F21_reasons: answer }).answers.F21_reasons, answer)
  }
})
