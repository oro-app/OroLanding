import { normalizeAnswers } from '../../lib/betaContract.js'
export { choices, textLimits } from '../../lib/betaContract.js'

export const emptyAnswers = {
  name: '', email: '', phone: '', instagram: '', usedOro: '', outfitDays: '',
  challenges: '', usualHelp: [], usualHelpOther: '',
  hopes: '', week: '', location: '', age: '', gender: '', genderDescription: '',
  source: '', sourceOther: '', terms: true, futureBeta: true, marketing: true,
}

export function visibleAnswers(answers) {
  const result = { ...answers }
  if (!answers.usualHelp.includes('Other')) delete result.usualHelpOther
  if (answers.source !== 'Other') delete result.sourceOther
  if (answers.gender !== 'I’d like to self-describe') delete result.genderDescription
  return result
}

export const formSteps = [
  { hash: '#phone', title: 'where should oro text you?', fields: ['phone'] },
  { hash: '#verify-phone', title: 'Verify your phone number', fields: [] },
  { hash: '#contact', title: 'what should she call you?', fields: ['name', 'email'] },
]

export function validateAnswers(answers) {
  return normalizeAnswers(answers).errors
}
