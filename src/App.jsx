import { useEffect } from 'react'
import IntroSection from './components/sections/IntroSection'
import NewsletterPage from './components/sections/NewsletterPage'
import NewsletterSection from './components/sections/NewsletterSection'
import SiteFooter from './components/sections/SiteFooter'
import CookieConsent from './components/sections/CookieConsent'
import { hasAnalyticsConsent, initAnalytics } from './lib/analytics'

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const newsletterMatch = path.match(/^\/newsletter\/([^/]+)$/)

  if (newsletterMatch) {
    return {
      type: 'newsletter',
      slug: decodeURIComponent(newsletterMatch[1]),
    }
  }

  return { type: 'home' }
}

function App() {
  const route = getRoute()

  useEffect(() => {
    if (hasAnalyticsConsent()) initAnalytics();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--cream)' }}>
      {route.type === 'newsletter' ? (
        <NewsletterPage slug={route.slug} />
      ) : (
        <>
          <IntroSection />
          <NewsletterSection />
          <SiteFooter />
        </>
      )}
      <CookieConsent />
    </div>
  )
}

export default App
