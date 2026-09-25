import { loadFeedbackForm } from './feedbackApi.js'
import { readFeedbackSession, writeFeedbackSession } from './feedbackSession.js'

const terminal = ['submitted', 'invalid_invitation', 'invitation_expired', 'missing_token']
const transient = ['rate_limited', 'temporarily_unavailable']

export function createFeedbackReader(token, onChange) {
  let request, timer
  let stopped = false
  let paused = true
  let backoff = 60

  function pause() {
    paused = true
    clearTimeout(timer)
    request?.abort()
    request = null
  }
  function stop() {
    stopped = true
    pause()
  }
  async function check() {
    if (stopped || paused || request) return
    clearTimeout(timer)
    try {
      const session = readFeedbackSession()
      if (!token || session?.token !== token) return stop()
      const wait = session.nextCheckAt - Date.now()
      if (wait > 0) {
        timer = setTimeout(check, Math.min(wait, 2147483647))
        return
      }
      const active = new AbortController()
      request = active
      writeFeedbackSession({ ...session, nextCheckAt: Date.now() + 15000 })
      const result = await loadFeedbackForm(token, { signal: active.signal })
      if (stopped || paused || active.signal.aborted) return
      request = null
      const current = readFeedbackSession()
      if (current?.token !== token) return stop()
      const status = result.ok ? result.form.status : result.code
      if (terminal.includes(status)) {
        writeFeedbackSession(null)
        stop()
      } else if (status === 'saving' || transient.includes(status)) {
        const seconds = status === 'saving' ? 15 : Math.max(backoff, result.retryAfter)
        backoff = status === 'saving' ? 60 : Math.min(backoff * 2, 300)
        const delay = Math.min(seconds * 1000, Number.MAX_SAFE_INTEGER)
        writeFeedbackSession({ ...current, nextCheckAt: Date.now() + delay })
        timer = setTimeout(check, Math.min(delay, 2147483647))
      } else {
        backoff = 60
      }
      onChange(result.ok ? { status, form: result.form } : { status })
    } catch {
      stop()
      onChange({ status: 'storage' })
    }
  }
  return {
    pause,
    stop,
    resume() {
      paused = false
      void check()
    },
  }
}
