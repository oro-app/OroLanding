const draftKey = (formKey) => `oro_feedback_draft:${formKey.split(':')[0]}`

export function readFeedbackDraft(formKey) {
  const cached = JSON.parse(localStorage.getItem(draftKey(formKey)))
  return cached?.formKey === formKey ? cached : null
}

export const writeFeedbackDraft = (formKey, value) => localStorage.setItem(draftKey(formKey), JSON.stringify({ formKey, ...value }))
export const clearFeedbackDraft = (formKey) => localStorage.removeItem(draftKey(formKey))
