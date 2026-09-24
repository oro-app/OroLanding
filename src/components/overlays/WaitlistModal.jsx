import { Button, Heading, TextField } from 'oro-kit'
import './WaitlistModal.css';
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '../../lib/analytics';
import { markNewsletterSignedUp } from '../../lib/newsletterSignup';

export default function WaitlistModal({ onClose }) {
  const dialogRef = useRef(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadyOnList, setAlreadyOnList] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (success || alreadyOnList) dialogRef.current?.querySelector('.modal-done-btn')?.focus()
  }, [success, alreadyOnList])

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
    }
    if (event.key !== 'Tab') return
    const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), a[href]')]
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

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
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="newsletter-signup-title" onKeyDown={handleDialogKeyDown} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose} aria-label="Close">✕</button>

        {success ? (
          <div className="modal-success">
            <div className="success-check">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">you're subscribed</p>
            <Heading variant="card" id="newsletter-signup-title">Thanks for joining.</Heading>
            <p className="modal-subtitle">We'll send thoughtful style notes and Oro updates to your inbox.</p>
            <Button variant="secondary" className="modal-done-btn" onClick={onClose}>Done</Button>
          </div>
        ) : alreadyOnList ? (
          <div className="modal-success">
            <div className="success-check">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">already subscribed</p>
            <Heading variant="card" id="newsletter-signup-title">You're already on the list.</Heading>
            <p className="modal-subtitle">No need to sign up again — you're set to receive the Oro newsletter.</p>
            <Button variant="secondary" className="modal-done-btn" onClick={onClose}>Got it</Button>
          </div>
        ) : (
          <>
            <p className="modal-eyebrow">newsletter</p>
            <Heading variant="card" id="newsletter-signup-title">Get style notes from Oro</Heading>
            <p className="modal-subtitle">Wardrobe ideas, product updates, and notes from our team — a few times a month.</p>

            <form onSubmit={handleSubmit}>
              <div className="email-form">
                <TextField
                  type="email"
                  label="Your email"
                  className="email-input"
                  placeholder="your@email.com"
                  autoComplete="email"
                  aria-describedby="newsletter-signup-consent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <Button type="submit" disabled={loading} aria-label="Subscribe to newsletter">
                  {loading ? 'Subscribing…' : 'Subscribe'}
                </Button>
              </div>

              <p className="consent-text" id="newsletter-signup-consent">
                By signing up, you agree to receive emails from Oro. Unsubscribe any time. See our{' '}
                <a href="/privacy" rel="noopener noreferrer">Privacy Policy</a>.
              </p>

              {error && <p className="modal-error" role="alert">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
