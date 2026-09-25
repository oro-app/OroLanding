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
