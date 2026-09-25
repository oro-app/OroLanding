const identifier = (value) => typeof value === 'string' && /^[A-Za-z0-9_]{1,64}$/.test(value)
  && !['__proto__', 'constructor', 'prototype'].includes(value)

export function validFeedbackQuestions(questions) {
  if (!Array.isArray(questions) || !questions.length) return false
  const ids = new Set()
  for (const question of questions) {
    if (!question || !identifier(question.id) || ids.has(question.id)
      || !['single', 'multiple', 'rating', 'text'].includes(question.type)
      || typeof question.prompt !== 'string' || !question.prompt.trim()
      || typeof question.required !== 'boolean' || typeof question.allow_comment !== 'boolean'
      || (question.helper != null && typeof question.helper !== 'string')
      || !Array.isArray(question.choices) || !Array.isArray(question.show_if)) return false
    ids.add(question.id)
    const choices = new Set()
    for (const option of question.choices) {
      if (!option || !identifier(option.id) || choices.has(option.id) || typeof option.label !== 'string'
        || !option.label.trim() || (option.score !== null && !Number.isInteger(option.score))) return false
      choices.add(option.id)
    }
    if (question.type === 'text' ? choices.size !== 0 : choices.size === 0) return false
  }
  const definitions = new Map(questions.map((question) => [question.id, question]))
  const checked = new Set(), checking = new Set()
  function validRules(question) {
    if (checked.has(question.id)) return true
    if (checking.has(question.id)) return false
    checking.add(question.id)
    for (const rule of question.show_if) {
      const controller = definitions.get(rule?.question_id)
      if (!controller || !['single', 'rating'].includes(controller.type) || !Array.isArray(rule.choice_ids)
        || !rule.choice_ids.length || !rule.choice_ids.every((id) => controller.choices.some((option) => option.id === id))
        || !validRules(controller)) return false
    }
    checking.delete(question.id)
    checked.add(question.id)
    return true
  }
  return questions.every(validRules)
}
