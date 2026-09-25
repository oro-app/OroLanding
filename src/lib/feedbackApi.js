import { validFeedbackQuestions } from './feedbackQuestions.js'

const API_BASE = import.meta.env?.VITE_ORO_API_URL || 'https://api.buildingoro.ca'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const MAX_FEEDBACK_BYTES = 64 * 1024
const ERROR_CODES = {
  401: ['missing_token'],
  404: ['invalid_invitation', 'feedback_disabled'],
  410: ['invitation_expired'],
  409: ['already_submitted', 'submission_id_conflict', 'survey_version_mismatch'],
  413: ['request_too_large'],
  422: ['invalid_answers'],
  429: ['rate_limited'],
}
const failure = (code = 'temporarily_unavailable', retryAfter = 60) => ({ ok: false, code, retryAfter })
const timestamp = (value) => typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value))

function validForm(form) {
  if (!form || !UUID.test(form.invitation_id) || !['task', 'daily', 'final'].includes(form.survey_kind)
    || !Number.isInteger(form.survey_version) || form.survey_version < 1 || !timestamp(form.expires_at)
    || !Array.isArray(form.questions) || typeof form.context?.beta_label !== 'string') return false
  if (form.survey_kind === 'daily' && (!/^\d{4}-\d\d-\d\d$/.test(form.context.local_date)
    || typeof form.context.timezone !== 'string')) return false
  if (form.survey_kind === 'task' && typeof form.context.task_label !== 'string') return false
  if (form.status === 'open') return validFeedbackQuestions(form.questions) && form.submission_id === null && form.receipt === null
  if (!UUID.test(form.submission_id) || form.questions.length !== 0) return false
  if (form.status === 'saving') return form.receipt === null
  return form.status === 'submitted' && form.receipt?.submission_id === form.submission_id && timestamp(form.receipt.submitted_at)
}

function retryDelay(header) {
  const date = /^[A-Za-z]{3,9}[, ]/.test(header ?? '') ? Date.parse(header) : NaN
  const seconds = /^\d+$/.test(header ?? '') ? Number(header) : (date - Date.now()) / 1000
  return Number.isFinite(seconds) ? Math.max(15, Math.ceil(seconds)) : 60
}

async function feedbackRequest(token, path, { signal, apiBase = API_BASE, body } = {}) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) return failure('missing_token')
  if (signal?.aborted) return failure('cancelled')
  let url
  try {
    url = new URL(`${apiBase.replace(/\/+$/, '')}/agent2/beta-feedback/${path}`)
    const localDevelopment = import.meta.env?.DEV && url.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      && ['localhost', '127.0.0.1', '[::1]'].includes(globalThis.location?.hostname)
    if ((!localDevelopment && url.protocol !== 'https:') || url.username || url.password || url.search || url.hash) return failure()
  } catch {
    return failure()
  }
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, 15000)
  try {
    const response = await fetch(url.href, {
      method: body === undefined ? 'GET' : 'PUT',
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body }),
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    })
    const data = await response.json().catch(() => null)
    controller.signal.throwIfAborted()
    if (!response.ok) {
      const code = data?.detail?.code
      const result = failure(ERROR_CODES[response.status]?.includes(code) ? code : undefined, retryDelay(response.headers.get('Retry-After')))
      if (result.code === 'invalid_answers' && Array.isArray(data.detail.question_ids)) {
        result.questionIds = data.detail.question_ids.filter((id) => typeof id === 'string' && /^[A-Za-z0-9_]{1,64}$/.test(id))
      }
      return result
    }
    return { ok: true, status: response.status, data }
  } catch {
    return failure(signal?.aborted ? 'cancelled' : undefined)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}

export async function loadFeedbackForm(token, options) {
  const result = await feedbackRequest(token, 'form', options)
  if (!result.ok) return result
  return result.status === 200 && validForm(result.data) ? { ok: true, form: result.data } : failure()
}

export async function saveFeedback(token, submissionId, body, options) {
  if (!UUID.test(submissionId) || typeof body !== 'string') return failure('invalid_answers')
  if (new TextEncoder().encode(body).byteLength > MAX_FEEDBACK_BYTES) return failure('request_too_large')
  const result = await feedbackRequest(token, `submissions/${submissionId}`, { ...options, body })
  if (!result.ok) return result
  if (result.status === 202 && result.data?.status === 'saving' && result.data.submission_id === submissionId) {
    return { ok: true, status: 'saving', submissionId }
  }
  if (result.status === 200 && result.data?.submission_id === submissionId && timestamp(result.data.submitted_at)) {
    return { ok: true, status: 'submitted', receipt: result.data }
  }
  return failure()
}
