import { Btn } from '@oro/web'
import './WaitlistModal.css';
import { useState } from 'react';
import { trackEvent } from '../../lib/analytics';
import { markNewsletterSignedUp } from '../../lib/newsletterSignup';

export default function WaitlistModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadyOnList, setAlreadyOnList] = useState(false)
  const [error, setError] = useState(null)

  // Consent used to be a separate checkbox; replaced with an inline blurb
  // below the email field ("by signing up, you agree..."). Submitting the
  // form is now the consent action, so we always send consent: true.
  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          consent: true,
          consent_timestamp: new Date().toISOString(),
        }),
      })

      if (res.status === 409) {
        markNewsletterSignedUp()
        setAlreadyOnList(true)
        setLoading(false)
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Try again.')
        setLoading(false)
        return
      }

      trackEvent('newsletter_signup', { method: 'email' })
      markNewsletterSignedUp()
      setSuccess(true)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose} aria-label="Close">✕</button>

        {success ? (
          <div className="modal-success">
            <div className="success-check">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">You're subscribed</p>
            <h3>Thanks for joining.</h3>
            <p className="modal-subtitle">We'll send thoughtful style notes and Oro updates to your inbox.</p>
            <Btn variant="quiet" className="modal-done-btn" onClick={onClose}>Done</Btn>
          </div>
        ) : alreadyOnList ? (
          <div className="modal-success">
            <div className="success-check">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">Already subscribed</p>
            <h3>You're already on the list.</h3>
            <p className="modal-subtitle">No need to sign up again — you're set to receive the Oro newsletter.</p>
            <Btn variant="quiet" className="modal-done-btn" onClick={onClose}>Got it</Btn>
          </div>
        ) : (
          <>
            <p className="modal-eyebrow">Newsletter</p>
            <h3>Get style notes from Oro</h3>
            <p className="modal-subtitle">Wardrobe ideas, product updates, and notes from our team — a few times a month.</p>

            <form onSubmit={handleSubmit}>
              <div className="email-form">
                <input
                  type="email"
                  className="email-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <button type="submit" className="email-submit-btn" disabled={loading} aria-label="Subscribe to newsletter">
                  {loading ? (
                    <span className="btn-spinner" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>

              <p className="consent-text">
                By signing up, you agree to receive emails from Oro. Unsubscribe any time. See our{' '}
                <a href="/privacy" rel="noopener noreferrer">Privacy Policy</a>.
              </p>

              {error && <p className="modal-error">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
