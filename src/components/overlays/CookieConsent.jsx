import { Btn } from '@oro/web'
import { useEffect, useState } from 'react'
import { setAnalyticsConsent } from '../../lib/analytics.js'

export default function CookieConsent() {
  // Render first-time consent in the prerendered HTML. Waiting for hydration
  // made the late-arriving banner the homepage LCP element on mobile.
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    try {
      const hasChoice = localStorage.getItem('oro_cookie_consent') !== null
      if (hasChoice) setVisible(false)
    } catch {
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  const handleChoice = (accepted) => {
    setAnalyticsConsent(accepted)
    document.documentElement.dataset.cookieConsent = 'set'
    setVisible(false)
  }

  return (
    <div className="cookie-consent-wrap" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-consent">
        <p className="cookie-consent-copy">
          We use analytics <a href="/cookies" rel="noopener noreferrer">cookies</a> to understand how people find and use our site.
        </p>
        <div className="cookie-consent-actions">
          <Btn variant="accent" className="cookie-consent-accept" onClick={() => handleChoice(true)}>
            accept
          </Btn>
          <Btn variant="ghost" className="cookie-consent-decline" onClick={() => handleChoice(false)}>
            no thanks
          </Btn>
        </div>
      </div>
    </div>
  )
}
