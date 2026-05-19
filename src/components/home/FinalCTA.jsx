import { trackEvent } from '../../lib/analytics'

// Final CTA — a SHARED section (single component; theme-aware colour, same
// layout in both themes). Faithful to
// the handoff's sections/final-cta.jsx. "try oro" opens the existing
// WaitlistModal (consistent with every other try-oro CTA on the page).
export default function FinalCTA({ onTryOro }) {
  const handleTryOro = () => {
    trackEvent('cta_click', { location: 'final-cta', destination: 'waitlist' })
    onTryOro?.()
  }

  return (
    <section id="try" className="fcta">
      <h2 className="fcta-title">
        start your <span className="fcta-em">morning</span> over.
      </h2>
      <p className="fcta-sub">free during early access. ios first — android soon.</p>
      <div className="fcta-actions">
        <button type="button" className="fcta-cta" onClick={handleTryOro}>
          try oro
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
