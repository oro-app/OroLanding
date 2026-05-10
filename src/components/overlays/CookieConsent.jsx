import { useState } from 'react'
import { setAnalyticsConsent } from '../../lib/analytics.js'
import './CookieConsent.css'

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => localStorage.getItem('oro_cookie_consent') === null)

  if (!visible) return null

  const handleChoice = (accepted) => {
    setAnalyticsConsent(accepted)
    setVisible(false)
  }

  return (
    <div className="cookie-consent-wrap" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-consent">
        <p className="cookie-consent-copy">
          We use analytics <a href="/cookies">cookies</a> to understand how people find and use our site.
        </p>
        <div className="cookie-consent-actions">
          <button type="button" className="cookie-consent-accept" onClick={() => handleChoice(true)}>
            Accept
          </button>
          <button type="button" className="cookie-consent-decline" onClick={() => handleChoice(false)}>
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}
