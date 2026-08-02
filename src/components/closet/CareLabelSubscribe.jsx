import { useState } from 'react'
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
        setError('something went wrong. try again.')
        setLoading(false)
        return
      }
      setDone(true)
    } catch {
      setError('something went wrong. try again.')
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
            <svg key={i} width="22" height="22" viewBox="0 0 22 22">
              {sym}
            </svg>
          ))}
        </div>

        {done ? (
          <p className="cl-success">
            ✓ you’re on the list. first letter lands this week.
          </p>
        ) : (
          <form className="cl-form" onSubmit={handleSubmit}>
            <input
              type="email"
              className="cl-input"
              placeholder="your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" className="oro-cta oro-cta--inline cl-submit" disabled={loading}>
              sign me up
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        )}
        {error && <p className="cl-error">{error}</p>}

        <div className="cl-fibre">
          <span>100% words. 0% spam.</span>
          <span>unsubscribe any day.</span>
        </div>
      </div>
    </section>
  )
}
