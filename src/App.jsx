import { lazy, Suspense, useEffect } from 'react'
import IntroSection from './components/home/IntroSection'
import NewsletterSection from './components/home/NewsletterSection'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import CookieConsent from './components/overlays/CookieConsent'
import { hasAnalyticsConsent, initAnalytics } from './lib/analytics'

// Code-split the article route — only fetched when /newsletter/:slug is opened.
const NewsletterPage = lazy(() => import('./components/newsletter/NewsletterPage'))

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

  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      const element = document.getElementById(hash.substring(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  return (
    <div className="min-h-screen overflow-x-clip" style={{ background: 'var(--cream)' }}>
      <SiteHeader />
      <main id="main">
        {route.type === 'newsletter' ? (
          <Suspense fallback={null}>
            <NewsletterPage slug={route.slug} />
          </Suspense>
        ) : (
          <>
            <IntroSection />
            <NewsletterSection />
            <SiteFooter />
          </>
        )}
      </main>
      <CookieConsent />
    </div>
  )
}

export default App
