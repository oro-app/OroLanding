import { useEffect } from 'react'
import IntroSection from './components/home/IntroSection'
import NewsletterSection from './components/home/NewsletterSection'
import NewsletterPage from './components/newsletter/NewsletterPage'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import CookieConsent from './components/overlays/CookieConsent'
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
      <SiteHeader />
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
