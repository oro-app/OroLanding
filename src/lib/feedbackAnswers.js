const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const answerFields = { single: 'choice', rating: 'choice', multiple: 'choices', text: 'text' }

export function pruneFeedbackDraft(questions, input = {}) {
  const draft = isObject(input) ? input : {}
  const definitions = new Map(questions.map((question) => [question.id, question]))
  const visibility = new Map()

  function isVisible(question) {
    if (visibility.has(question.id)) return visibility.get(question.id)
    visibility.set(question.id, false)
    const visible = question.show_if.every((rule) => {
      const controller = definitions.get(rule.question_id)
      const answer = draft[rule.question_id]
      return controller && isVisible(controller)
        && ['single', 'rating'].includes(controller.type) && isObject(answer)
        && controller.choices.some((option) => option.id === answer.choice)
        && rule.choice_ids.includes(answer.choice)
    })
    visibility.set(question.id, visible)
    return visible
  }

  const visibleQuestions = questions.filter(isVisible)
  const answers = Object.fromEntries(visibleQuestions
    .filter((question) => Object.hasOwn(draft, question.id))
    .map((question) => {
      const value = draft[question.id]
      if (!isObject(value)) return [question.id, Array.isArray(value) ? [...value] : value]
      const fields = [answerFields[question.type]]
      if (question.type !== 'text') {
        const selected = question.type === 'multiple' ? value.choices : [value.choice]
        if (Array.isArray(selected) && selected.includes('other')) fields.push('other_text')
        if (question.allow_comment) fields.push('comment')
      }
      const answer = Object.fromEntries(Object.entries(value).filter(([key]) => fields.includes(key)))
      if (Array.isArray(answer.choices)) answer.choices = [...answer.choices]
      return [question.id, answer]
    }))
  return { questions: visibleQuestions, answers }
}

export function prepareFeedbackAnswers(questions, draft) {
  const active = pruneFeedbackDraft(questions, draft)
  const answers = {}, errors = {}
  for (const question of active.questions) {
    const field = answerFields[question.type]
    const value = active.answers[question.id]
    const fail = (name, message) => { errors[question.id] ??= { field: name, message } }
    const written = (name, required) => {
      const raw = value?.[name]
      if (raw === undefined || raw === null || raw === '') {
        if (required) fail(name, 'Please add an answer.')
        return ''
      }
      if (typeof raw !== 'string') { fail(name, 'Please enter a written answer.'); return '' }
      const text = raw.trim()
      if (!text && required) fail(name, 'Please add an answer.')
      if ([...text].length > 2000) fail(name, 'Please keep your answer to 2,000 characters.')
      return text
    }
    if (value !== undefined && !isObject(value)) {
      fail(field, 'Please check this answer.')
      continue
    }
    if (question.type === 'text') {
      const text = written('text', question.required)
      if (text) answers[question.id] = { text }
      continue
    }
    const selected = question.type === 'multiple' ? (value?.choices ?? [])
      : (value?.choice == null || value.choice === '' ? [] : [value.choice])
    if (!Array.isArray(selected) || selected.some((id) => typeof id !== 'string' || !question.choices.some((option) => option.id === id))
      || new Set(selected).size !== selected.length) {
      fail(field, 'Choose from the listed answers.')
      continue
    }
    if (!selected.length) {
      if (question.required) fail(field, question.type === 'multiple' ? 'Choose at least one answer.' : 'Choose an answer.')
      if (question.allow_comment && written('comment', false)) fail(field, 'Choose an answer to include your explanation.')
      continue
    }
    const answer = { [field]: question.type === 'multiple' ? [...selected].sort() : selected[0] }
    if (selected.includes('other')) answer.other_text = written('other_text', true)
    if (question.allow_comment) {
      const comment = written('comment', false)
      if (comment) answer.comment = comment
    }
    answers[question.id] = answer
  }
  return { answers, errors }
}
