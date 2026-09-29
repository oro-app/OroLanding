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
  { hash: '#request', title: 'What should we call you?', fields: ['name'] },
  { hash: '#contact', title: 'How can we reach you?', fields: ['email', 'phone', 'instagram'] },
  { hash: '#used-oro', title: 'Have you used the oro app before?', fields: ['usedOro'] },
  { hash: '#your-style', title: 'In the past 7 days, on how many days did you want help choosing or improving an outfit?', fields: ['outfitDays'] },
  { hash: '#style-challenges', title: 'What do you find difficult about putting outfits together, if anything?', fields: ['challenges'] },
  { hash: '#usual-help', title: 'What do you usually do when you’re unsure about an outfit?', fields: ['usualHelp', 'usualHelpOther'] },
  { hash: '#your-city', title: 'What city and province do you live in?', fields: ['location'] },
  { hash: '#your-age', title: 'What’s your age range?', fields: ['age'] },
  { hash: '#your-gender', title: 'What’s your gender?', fields: ['gender', 'genderDescription'] },
  { hash: '#heard-about-oro', title: 'How did you hear about oro’s beta?', fields: ['source', 'sourceOther'] },
  { hash: '#before-send', title: 'Ready to be one of the first oronauts?', fields: ['terms'] },
]

export function validateAnswers(answers) {
  return normalizeAnswers(answers).errors
}
