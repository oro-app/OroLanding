const API_BASE = import.meta.env?.VITE_ORO_API_URL || 'https://api.buildingoro.ca'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ERROR_CODES = {
  401: ['missing_token'],
  404: ['invalid_invitation', 'feedback_disabled'],
  410: ['invitation_expired'],
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
  if (form.status === 'open') return form.questions.length > 0 && form.submission_id === null && form.receipt === null
  if (!UUID.test(form.submission_id) || form.questions.length !== 0) return false
  if (form.status === 'saving') return form.receipt === null
  return form.status === 'submitted' && form.receipt?.submission_id === form.submission_id && timestamp(form.receipt.submitted_at)
}

function retryDelay(header) {
  const date = /^[A-Za-z]{3,9}[, ]/.test(header ?? '') ? Date.parse(header) : NaN
  const seconds = /^\d+$/.test(header ?? '') ? Number(header) : (date - Date.now()) / 1000
  return Number.isFinite(seconds) ? Math.max(15, Math.ceil(seconds)) : 60
}

export async function loadFeedbackForm(token, { signal, apiBase = API_BASE } = {}) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) return failure('missing_token')
  if (signal?.aborted) return failure('cancelled')
  let url
  try {
    url = new URL(`${apiBase.replace(/\/+$/, '')}/agent2/beta-feedback/form`)
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return failure()
  } catch {
    return failure()
  }
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  const timeout = setTimeout(abort, 15000)
  try {
    const response = await fetch(url.href, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      redirect: 'error',
    })
    const form = await response.json().catch(() => null)
    controller.signal.throwIfAborted()
    if (response.status !== 200) {
      const code = form?.detail?.code
      return failure(ERROR_CODES[response.status]?.includes(code) ? code : undefined, retryDelay(response.headers.get('Retry-After')))
    }
    return validForm(form) ? { ok: true, form } : failure()
  } catch {
    return failure(signal?.aborted ? 'cancelled' : undefined)
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', abort)
  }
}
