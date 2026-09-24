import { parsePhoneNumberFromString } from 'libphonenumber-js/max'

export const FORM_VERSION = '2026-09-24.1'
export const CONSENT_VERSION = '2026-09-24.1'
export const UUID4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const MAX_BODY_BYTES = 64 * 1024
export const choices = {
  usedOro: ['Yes', 'No'],
  outfitDays: ['0 days', '1–2 days', '3–4 days', '5–7 days', 'I don’t remember'],
  usualHelp: ['Ask a friend', 'Look online for inspiration', 'Use another AI assistant', 'Buy something', 'Other'],
  age: ['Under 18', '18–22', '23–28', '29–34'],
  gender: ['Woman', 'Man', 'Nonbinary', 'I’d like to self-describe', 'Prefer not to say'],
  source: ['Instagram', 'Word of mouth', 'Website', 'Other'],
}
export const textLimits = {
  name: 100, email: 254, phone: 64, instagram: 31, occasion: 2000, uncertainty: 2000,
  challenges: 2000, usualHelpOther: 2000, hopes: 2000, week: 2000, location: 2000,
  genderDescription: 2000, sourceOther: 2000,
}
export const answerFields = [...Object.keys(textLimits), ...Object.keys(choices), 'terms', 'futureBeta', 'marketing']
const requiredText = ['name', 'email', 'phone', 'occasion', 'uncertainty', 'challenges', 'hopes', 'week', 'location']

export function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function normalizeAnswers(input) {
  const answers = {}, errors = {}
  if (!isObject(input)) return { answers, errors: { form: 'Please check your answers.' } }
  if (Object.keys(input).some((key) => !answerFields.includes(key))) errors.form = 'Unexpected answer field.'
  for (const [name, limit] of Object.entries(textLimits)) {
    const value = input[name] ?? ''
    answers[name] = typeof value === 'string' ? value.trim() : ''
    if (typeof value !== 'string' || value.length > limit) errors[name] = `Please keep your answer to ${limit.toLocaleString('en-US')} characters.`
  }
  for (const name of requiredText) if (!answers[name]) errors[name] = 'Please add an answer.'
  answers.email = answers.email.toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) errors.email = 'Enter a valid email address.'
  const phone = parsePhoneNumberFromString(answers.phone.replace(/^(whatsapp:|sms:|tel:)/i, '').trim(), { defaultCountry: 'CA', extract: false })
  if (!phone?.isValid() || phone.ext) errors.phone = 'Enter a valid phone number, including the country code if outside Canada or the US.'
  else answers.phone = phone.number
  if (answers.instagram && !/^@?[A-Za-z0-9._]{1,30}$/.test(answers.instagram)) errors.instagram = 'Enter a handle, with or without @, rather than a profile link.'
  answers.instagram = answers.instagram.replace(/^@/, '')
  for (const [name, options] of Object.entries(choices)) {
    const value = input[name] ?? (name === 'usualHelp' ? [] : '')
    if (name === 'usualHelp') {
      answers[name] = Array.isArray(value) ? options.filter((option) => value.includes(option)) : []
      if (!Array.isArray(value) || !value.length || value.length > options.length || new Set(value).size !== value.length || value.some((option) => !options.includes(option))) errors[name] = 'Choose at least one of the listed answers.'
    } else {
      answers[name] = typeof value === 'string' ? value : ''
      if (!options.includes(value) && !(['age', 'gender'].includes(name) && value === '')) errors[name] = 'Choose one of the listed answers.'
    }
  }
  for (const [name, shown] of Object.entries({
    usualHelpOther: answers.usualHelp.includes('Other'), sourceOther: answers.source === 'Other', genderDescription: answers.gender === 'I’d like to self-describe',
  })) {
    if (!shown) { answers[name] = ''; delete errors[name] }
    else if (name !== 'genderDescription' && !answers[name]) errors[name] = 'Please add an answer.'
  }
  for (const name of ['terms', 'futureBeta', 'marketing']) {
    answers[name] = input[name] === true
    if (input[name] !== undefined && typeof input[name] !== 'boolean') errors[name] = 'Please check this choice.'
  }
  if (!answers.terms) errors.terms = 'Please agree to the Terms of Service to request an invite.'
  return { answers, errors }
}

export function validateSubmission(body) {
  if (!isObject(body) || Object.keys(body).some((key) => !['submission_key', 'form_version', 'consent_version', 'answers'].includes(key)) || typeof body.submission_key !== 'string' || !UUID4.test(body.submission_key)) return { code: 'invalid_request' }
  if (body.form_version !== FORM_VERSION || body.consent_version !== CONSENT_VERSION) return { code: 'outdated_form' }
  const result = normalizeAnswers(body.answers)
  return Object.keys(result.errors).length ? { code: 'invalid_answers', errors: result.errors } : { answers: result.answers }
}

export function canonicalPayload(answers, cohort) {
  return JSON.stringify({ cohort, form_version: FORM_VERSION, consent_version: CONSENT_VERSION, answers })
}
