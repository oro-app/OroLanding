import { Btn } from '@oro/web'
import './WaitlistModal.css';
import { useEffect, useRef, useState } from 'react';
import { trackEvent } from '../../lib/analytics';
import { markNewsletterSignedUp } from '../../lib/newsletterSignup';

export default function WaitlistModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadyOnList, setAlreadyOnList] = useState(false)
  const [error, setError] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [validationAttempt, setValidationAttempt] = useState(0)
  const dialogRef = useRef(null)
  const emailInputRef = useRef(null)
  const resultHeadingRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    previousFocusRef.current = document.activeElement
    if (!dialog.open) dialog.showModal()
    emailInputRef.current?.focus()

    return () => {
      if (dialog.open) dialog.close()
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus()
    }
  }, [])

  useEffect(() => {
    if (success || alreadyOnList) resultHeadingRef.current?.focus()
  }, [success, alreadyOnList])

  useEffect(() => {
    if (validationAttempt) emailInputRef.current?.focus()
  }, [validationAttempt])

  const closeDialog = () => {
    onClose()
  }

  // Consent used to be a separate checkbox; replaced with an inline blurb
  // below the email field ("by signing up, you agree..."). Submitting the
  // form is now the consent action, so we always send consent: true.
  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    const emailInput = e.currentTarget.elements.email

    if (!cleanEmail) {
      setEmailError('Enter your email address.')
      setValidationAttempt((attempt) => attempt + 1)
      return
    }

    if (!emailInput.validity.valid) {
      setEmailError('Enter an email address in the format name@example.com.')
      setValidationAttempt((attempt) => attempt + 1)
      return
    }

    setLoading(true)
    setError(null)
    setEmailError(null)

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
        setError('We could not subscribe you. Try again.')
        setLoading(false)
        return
      }

      trackEvent('newsletter_signup', { method: 'email' })
      markNewsletterSignedUp()
      setSuccess(true)
    } catch {
      setError('We could not subscribe you. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-backdrop"
      aria-labelledby="newsletter-dialog-title"
      aria-describedby="newsletter-dialog-description"
      onCancel={(e) => {
        e.preventDefault()
        closeDialog()
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeDialog()
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close-x" onClick={closeDialog} aria-label="Close newsletter signup">
          <span aria-hidden="true">✕</span>
        </button>

        {success ? (
          <div className="modal-success">
            <div className="success-check" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">you're subscribed</p>
            <h2 id="newsletter-dialog-title" ref={resultHeadingRef} tabIndex="-1">thanks for joining.</h2>
            <p id="newsletter-dialog-description" className="modal-subtitle">we'll send thoughtful style notes and oro updates to your inbox.</p>
            <Btn variant="quiet" className="modal-done-btn" onClick={closeDialog}>done</Btn>
          </div>
        ) : alreadyOnList ? (
          <div className="modal-success">
            <div className="success-check" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" focusable="false">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">already subscribed</p>
            <h2 id="newsletter-dialog-title" ref={resultHeadingRef} tabIndex="-1">you're already on the list.</h2>
            <p id="newsletter-dialog-description" className="modal-subtitle">no need to sign up again — you're set to receive the oro newsletter.</p>
            <Btn variant="quiet" className="modal-done-btn" onClick={closeDialog}>got it</Btn>
          </div>
        ) : (
          <>
            <p className="modal-eyebrow">newsletter</p>
            <h2 id="newsletter-dialog-title">get style notes from oro</h2>
            <p id="newsletter-dialog-description" className="modal-subtitle">wardrobe ideas, product updates, and notes from our team — a few times a month.</p>

            <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
              <label className="modal-form-label" htmlFor="newsletter-email">Email address (required)</label>
              <div className="email-form">
                <input
                  ref={emailInputRef}
                  id="newsletter-email"
                  name="email"
                  type="email"
                  className="email-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError(null)
                    setError(null)
                  }}
                  autoComplete="email"
                  aria-invalid={emailError ? 'true' : undefined}
                  aria-describedby={emailError ? 'newsletter-email-error' : undefined}
                  required
                  autoFocus
                />
                <button type="submit" className="email-submit-btn" disabled={loading} aria-label={loading ? 'Subscribing to newsletter' : 'Subscribe to newsletter'}>
                  {loading ? (
                    <span className="btn-spinner" aria-hidden="true" />
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
                      <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>

              {emailError && <p id="newsletter-email-error" className="modal-error">{emailError}</p>}

              <p className="consent-text">
                by signing up, you agree to receive emails from oro. unsubscribe any time. see our{' '}
                <a href="/privacy" rel="noopener noreferrer">privacy policy</a>.
              </p>

              <p className={error ? 'modal-error' : 'modal-form-status'} role="status">{loading ? 'Subscribing…' : error || ''}</p>
            </form>
          </>
        )}
      </div>
    </dialog>
  )
}
