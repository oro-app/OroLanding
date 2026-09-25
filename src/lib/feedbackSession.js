const SESSION_KEY = 'oro_feedback_session'
export const isFeedbackPath = (path) => /^\/feedback(?:\/index\.html)?\/*$/.test(path)

export function captureFeedbackSession() {
  if (typeof window === 'undefined' || !isFeedbackPath(location.pathname)) return 'missing'
  const fragment = location.hash
  const incoming = fragment && fragment !== '#main'
  try {
    if (incoming) history.replaceState(null, '', location.pathname + location.search)
    let previous
    try {
      previous = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    } catch {
      sessionStorage.removeItem(SESSION_KEY)
    }
    if (!incoming) return previous?.token ? 'unavailable' : 'missing'
    const token = /^#token=([A-Za-z0-9_-]+)$/.exec(fragment)?.[1]
    if (token && token === previous?.token) return 'unavailable'
    sessionStorage.removeItem(SESSION_KEY)
    if (!token) return 'missing'
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token }))
    return 'unavailable'
  } catch {
    return 'storage'
  }
}

export const initialFeedbackStatus = captureFeedbackSession()
