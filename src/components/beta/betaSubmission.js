import { CONSENT_VERSION, FORM_VERSION, UUID4, normalizeAnswers } from '../../lib/betaContract.js'

export async function saveBetaRequest(answers, key, fetcher = fetch) {
  try {
    const response = await fetcher('/api/beta-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_key: key, form_version: FORM_VERSION, consent_version: CONSENT_VERSION, answers: normalizeAnswers(answers).answers }),
      signal: AbortSignal.timeout(25000),
    })
    const result = await response.json()
    if (response.ok && result.ok === true && result.submission_key === key && UUID4.test(result.request_id || '')) return { requestId: result.request_id }
    if (!response.ok && ['submission_conflict', 'signup_closed', 'rate_limited', 'outdated_form', 'invalid_answers'].includes(result.code)) return { code: result.code }
  } catch { /* A lost response may follow a successful save, so retry with the same key. */ }
  return { code: 'temporarily_unavailable' }
}

export const submissionMessages = {
  temporarily_unavailable: ['We couldn’t confirm your request.', 'Your answers are still here. Try again to check or finish saving the same request.'],
  signup_closed: ['Invite requests are paused.', 'Your answers are still here. Please try again later or email sunny@buildingoro.ca.'],
  rate_limited: ['Please wait a minute before trying again.', 'Your answers are still here.'],
  outdated_form: ['This form has changed.', 'Please keep a copy of your answers, then refresh the page to use the latest form.'],
  invalid_answers: ['We couldn’t accept these answers.', 'Please check your answers. If this continues, email sunny@buildingoro.ca.'],
  submission_conflict: ['Your earlier answers were already saved.', 'These answers are different. Choose “Send updated request” to save them as a new request.'],
}
