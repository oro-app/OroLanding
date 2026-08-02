import UiButton from '../base/UiButton'
import { useEffect, useState } from 'react'
import { setAnalyticsConsent } from '../../lib/analytics.js'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem('oro_cookie_consent') === null)
    } catch {
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  const handleChoice = (accepted) => {
    setAnalyticsConsent(accepted)
    setVisible(false)
  }

  return (
    <div className="cookie-consent-wrap" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-consent">
        <p className="cookie-consent-copy">
          We use analytics <a href="/cookies" rel="noopener noreferrer">cookies</a> to understand how people find and use our site.
        </p>
        <div className="cookie-consent-actions">
          <UiButton label="accept" onPress={() => handleChoice(true)} />
          <UiButton label="no thanks" variant="tertiary" onPress={() => handleChoice(false)} />
        </div>
      </div>
    </div>
  )
}
