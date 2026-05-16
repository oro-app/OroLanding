export const NEWSLETTER_SIGNUP_SEEN_SESSION_KEY = 'oro_newsletter_signup_seen_session'
export const NEWSLETTER_SIGNED_UP_KEY = 'oro_newsletter_signed_up'

export function hasSeenNewsletterSignupThisSession() {
  try {
    return window.sessionStorage.getItem(NEWSLETTER_SIGNUP_SEEN_SESSION_KEY) === 'true'
  } catch {
    return true
  }
}

export function markNewsletterSignupSeenThisSession() {
  try {
    window.sessionStorage.setItem(NEWSLETTER_SIGNUP_SEEN_SESSION_KEY, 'true')
  } catch {
    // Ignore storage failures.
  }
}

export function hasSignedUpForNewsletter() {
  try {
    return window.localStorage.getItem(NEWSLETTER_SIGNED_UP_KEY) === 'true'
  } catch {
    return false
  }
}

export function markNewsletterSignedUp() {
  try {
    window.localStorage.setItem(NEWSLETTER_SIGNED_UP_KEY, 'true')
  } catch {
    // Ignore storage failures.
  }
}
