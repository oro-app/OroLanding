import { useEffect, useRef, useState } from 'react'
import { Cta } from '@oro/web'
import { trackCtaClick } from '../../lib/analytics'
import './CareLabelSubscribe.css'

// Subscribe block styled as a fabric care label — cream rectangle pinned
// to the plum surface, with dashed stitching, two punched holes at top,
// care symbols, and an underlined email form. Always cream regardless of
// theme (the tag is a physical object pinned to the page).

const CARE_SYMBOLS = [
  // Wash tub
  <path key="wash" d="M2 7 Q11 4 20 7 L18 18 Q11 16 4 18 Z" fill="none" stroke="currentColor" strokeWidth="1.1" />,
  // Triangle (bleach)
  <path key="tri" d="M11 3 L19 19 L3 19 Z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />,
  // Circle (dryclean)
  <circle key="circ" cx="11" cy="11" r="8" fill="none" stroke="currentColor" strokeWidth="1.1" />,
  // Square (tumble dry)
  <rect key="sq" x="3" y="3" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.1" />,
  // Iron
  <g key="iron"><path d="M3 15 L4 9 Q11 4 19 9 Z" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" /><path d="M3 17 L19 17" stroke="currentColor" strokeWidth="1.1" /></g>,
]

// The cadence is twice a week — no need to compute a "next month".

export default function CareLabelSubscribe() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [emailError, setEmailError] = useState(null)
  const [validationAttempt, setValidationAttempt] = useState(0)
  const emailInputRef = useRef(null)
  const resultRef = useRef(null)

  useEffect(() => {
    if (validationAttempt) emailInputRef.current?.focus()
  }, [validationAttempt])

  useEffect(() => {
    if (done) resultRef.current?.focus()
  }, [done])

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

    trackCtaClick('join_mailing_list_click', { location: 'journal_archive' })

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
      if (!res.ok && res.status !== 409) {
        setError('We could not sign you up. Try again.')
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError('We could not sign you up. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="cl-wrap">
      <div className="cl-tag">
        {/* dashed stitched border, sits inset from the tag edge */}
        <div className="cl-stitch" aria-hidden="true" />

        {/* two punched holes at the top */}
        <div className="cl-holes" aria-hidden="true">
          <span className="cl-hole" />
          <span className="cl-hole" />
        </div>

        <p className="cl-kicker">letters from oro · twice a week</p>

        <h2 className="cl-title">
          one letter.<br />
          <span className="cl-em">twice a week.</span>
        </h2>

        <p className="cl-body">
          we spend most of our time building oro. but we also just really like fashion, and this is where that goes.
        </p>

        <div className="cl-symbols" aria-hidden="true">
          {CARE_SYMBOLS.map((sym, i) => (
            <svg key={i} width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
              {sym}
            </svg>
          ))}
        </div>

        {!done && (
          <>
            <label className="cl-label" htmlFor="care-label-email">Email address (required)</label>
            <form className="cl-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
              <input
                ref={emailInputRef}
                id="care-label-email"
                name="email"
                type="email"
                className="cl-input"
                placeholder="your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setEmailError(null)
                  setError(null)
                }}
                autoComplete="email"
                aria-invalid={emailError ? 'true' : undefined}
                aria-describedby={emailError ? 'care-label-email-error' : undefined}
                required
                disabled={loading}
              />
              <Cta size="inline" type="submit" className="cl-submit" disabled={loading}>
                sign me up
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Cta>
            </form>
            {emailError && <p id="care-label-email-error" className="cl-field-error">{emailError}</p>}
          </>
        )}
        <p
          ref={resultRef}
          className={`cl-form-status${done ? ' cl-success' : error ? ' cl-error' : ''}`}
          role={done ? undefined : 'status'}
          tabIndex={done ? -1 : undefined}
        >
          {done ? <><span aria-hidden="true">✓ </span>you’re on the list. first letter lands this week.</> : loading ? 'Signing you up…' : error || ''}
        </p>

        <div className="cl-fibre">
          <span>100% words. 0% spam.</span>
          <span>unsubscribe any day.</span>
        </div>
      </div>
    </section>
  )
}
