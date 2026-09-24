import { normalizeAnswers } from '../../lib/betaContract.js'
export { choices, textLimits } from '../../lib/betaContract.js'

export const emptyAnswers = {
  name: '', email: '', phone: '', instagram: '', usedOro: '', outfitDays: '',
  occasion: '', uncertainty: '', challenges: '', usualHelp: [], usualHelpOther: '',
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
  { hash: '#request', title: 'First, what’s your name?', fields: ['name'] },
  { hash: '#contact', title: 'How can we reach you?', fields: ['email', 'phone', 'instagram'] },
  { hash: '#used-oro', title: 'Have you used the Oro app before?', fields: ['usedOro'] },
  { hash: '#your-style', title: 'In the past 7 days, on how many days did you want help choosing or improving an outfit?', fields: ['outfitDays'] },
  { hash: '#last-outfit', title: 'Think about the most recent time you wanted help with an outfit.', description: 'If you don’t have a recent example, you can say that.', fields: ['occasion', 'uncertainty'] },
  { hash: '#style-challenges', title: 'What do you find difficult about putting outfits together, if anything?', fields: ['challenges'] },
  { hash: '#usual-help', title: 'What do you usually do when you’re unsure about an outfit?', fields: ['usualHelp', 'usualHelpOther'] },
  { hash: '#your-hopes', title: 'How do you see Oro helping you?', fields: ['hopes'] },
  { hash: '#your-week', title: 'What does your week look like from September 25–30?', fields: ['week'] },
  { hash: '#your-city', title: 'What city and province do you live in?', fields: ['location'] },
  { hash: '#your-age', title: 'What’s your age range?', optional: true, fields: ['age'] },
  { hash: '#your-gender', title: 'What’s your gender?', optional: true, fields: ['gender', 'genderDescription'] },
  { hash: '#heard-about-oro', title: 'How did you hear about Oro’s beta?', fields: ['source', 'sourceOther'] },
  { hash: '#before-send', title: 'Ready to be one of the first Oronauts?', fields: ['terms'] },
]

export function validateAnswers(answers) {
  return normalizeAnswers(answers).errors
}
