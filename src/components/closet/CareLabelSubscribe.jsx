import { useState } from 'react'
import { Button, Heading, Text } from 'oro-kit'
import { trackCtaClick } from '../../lib/analytics'
import './CareLabelSubscribe.css'

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return

    trackCtaClick('join_mailing_list_click', { location: 'journal_archive' })

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
      if (!res.ok && res.status !== 409) {
        setError('Something went wrong. Try again.')
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError('Something went wrong. Try again.')
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

        <Text variant="label" muted className="cl-kicker">Letters from Oro · twice a week</Text>

        <Heading variant="title" className="cl-title">
          One letter.<br />
          <span className="cl-em">Twice a week.</span>
        </Heading>

        <Text muted className="cl-body">
          We spend most of our time building Oro. But we also just really like fashion, and this is where that goes.
        </Text>

        <div className="cl-symbols" aria-hidden="true">
          {CARE_SYMBOLS.map((sym, i) => (
            <svg key={i} width="22" height="22" viewBox="0 0 22 22">
              {sym}
            </svg>
          ))}
        </div>

        {done ? (
          <p className="cl-success" role="status">
            ✓ You’re on the list. First letter lands this week.
          </p>
        ) : (
          <form className="cl-form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="oro-input cl-input"
              placeholder="Your email"
              aria-label="Your email"
              autoComplete="email"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'closet-signup-error' : undefined}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <Button className="cl-submit" type="submit" disabled={loading}>
              Sign me up
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Button>
          </form>
        )}
        {error && <p className="cl-error" id="closet-signup-error" role="alert">{error}</p>}

        <div className="cl-fibre">
          <span>100% words. 0% spam.</span>
          <span>Unsubscribe any day.</span>
        </div>
      </div>
    </section>
  )
}
