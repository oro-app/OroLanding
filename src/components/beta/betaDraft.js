import { CONSENT_VERSION, FORM_VERSION, UUID4 } from '../../lib/betaContract.js'
import { choices, emptyAnswers, textLimits } from './betaForm.js'

const draftKey = 'oro_beta_request_draft'

export function readBetaDraft() {
  if (typeof window === 'undefined') return null
  try {
    const saved = JSON.parse(localStorage.getItem(draftKey))
    if (!saved) return null
    if (saved.formVersion !== FORM_VERSION || saved.consentVersion !== CONSENT_VERSION || !saved.answers || typeof saved.answers !== 'object' || Array.isArray(saved.answers)) {
      clearBetaDraft()
      return null
    }
    const answers = { ...emptyAnswers }
    for (const name of Object.keys(answers)) {
      const value = saved.answers[name]
      if (name === 'usualHelp') answers[name] = Array.isArray(value) ? choices.usualHelp.filter((option) => value.includes(option)) : []
      else if (name in choices) answers[name] = choices[name].includes(value) ? value : ''
      else if (name in textLimits) answers[name] = typeof value === 'string' ? value.slice(0, textLimits[name]) : ''
      else answers[name] = typeof value === 'boolean' ? value : emptyAnswers[name]
    }
    return { answers, submissionKey: UUID4.test(saved.submissionKey || '') ? saved.submissionKey : null }
  } catch { return null }
}

export function writeBetaDraft(answers, submissionKey) {
  try { localStorage.setItem(draftKey, JSON.stringify({ formVersion: FORM_VERSION, consentVersion: CONSENT_VERSION, answers, submissionKey })) } catch { /* The form still works if storage is unavailable. */ }
}

export function clearBetaDraft() {
  try { localStorage.removeItem(draftKey) } catch { /* A confirmed request remains complete. */ }
}
