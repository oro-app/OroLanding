import { Btn } from '@oro/web'
import { useEffect, useRef, useState } from 'react'
import { setAnalyticsConsent } from '../../lib/analytics.js'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const bannerRef = useRef(null)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem('oro_cookie_consent') === null)
    } catch {
      setVisible(false)
    }
  }, [])

  useEffect(() => {
    if (!visible || !bannerRef.current) return undefined
    const banner = bannerRef.current
    const updateReservedSpace = () => {
      document.documentElement.style.setProperty('--cookie-consent-height', `${Math.ceil(banner.getBoundingClientRect().height)}px`)
    }
    const observer = new ResizeObserver(updateReservedSpace)
    updateReservedSpace()
    observer.observe(banner)
    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty('--cookie-consent-height')
    }
  }, [visible])

  if (!visible) return null

  const handleChoice = (accepted) => {
    setAnalyticsConsent(accepted)
    setVisible(false)
  }

  return (
    <section ref={bannerRef} className="cookie-consent-wrap" aria-label="cookie consent">
      <div className="cookie-consent">
        <p className="cookie-consent-copy">
          we use analytics <a href="/cookies" rel="noopener noreferrer">cookies</a> to understand how people find and use our site.
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
    </section>
  )
}
