export const choices = {
  usedOro: ['Yes', 'No'],
  outfitDays: ['0 days', '1–2 days', '3–4 days', '5–7 days', 'I don’t remember'],
  usualHelp: ['Ask a friend', 'Look online for inspiration', 'Use another AI assistant', 'Buy something', 'Other'],
  age: ['Under 18', '18–22', '23–28', '29–34'],
  gender: ['Woman', 'Man', 'Nonbinary', 'I’d like to self-describe', 'Prefer not to say'],
  source: ['Instagram', 'Word of mouth', 'Website', 'Other'],
}

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
  { hash: '#your-week', title: 'What does your week look like from September 26–October 1?', fields: ['week'] },
  { hash: '#your-city', title: 'What city and province do you live in?', fields: ['location'] },
  { hash: '#your-age', title: 'What’s your age range?', optional: true, fields: ['age'] },
  { hash: '#your-gender', title: 'What’s your gender?', optional: true, fields: ['gender', 'genderDescription'] },
  { hash: '#heard-about-oro', title: 'How did you hear about Oro’s beta?', fields: ['source', 'sourceOther'] },
  { hash: '#before-send', title: 'Ready to be one of the first Oronauts?', fields: ['terms'] },
]

export function validateAnswers(answers) {
  const errors = {}
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email.trim())) errors.email = 'Enter a valid email address.'
  const phone = answers.phone.trim().replace(/[\s().-]/g, '')
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) errors.phone = 'Include your country code, for example +1 416 555 0123.'
  if (answers.instagram && !/^@?[A-Za-z0-9._]{1,30}$/.test(answers.instagram.trim())) errors.instagram = 'Enter a handle, with or without @, rather than a profile link.'
  for (const name of ['name', 'usedOro', 'outfitDays', 'occasion', 'uncertainty', 'challenges', 'hopes', 'week', 'location', 'source']) {
    if (!answers[name].trim()) errors[name] = 'Please add an answer.'
  }
  if (!answers.usualHelp.length) errors.usualHelp = 'Choose at least one answer.'
  if (answers.usualHelp.includes('Other') && !answers.usualHelpOther.trim()) errors.usualHelpOther = 'Tell us what else you do.'
  if (answers.source === 'Other' && !answers.sourceOther.trim()) errors.sourceOther = 'Tell us where you heard about it.'
  for (const [name, value] of Object.entries(visibleAnswers(answers))) {
    if (typeof value === 'string' && value.length > 2000) errors[name] = 'Please keep your answer to 2,000 characters.'
  }
  if (!answers.terms) errors.terms = 'Please agree to the Terms of Service to request an invite.'
  return errors
}
