import { lazy, Suspense, useEffect, useState } from 'react'
import Hero from './components/home/Hero'
import NewsletterSection from './components/home/NewsletterSection'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import CookieConsent from './components/overlays/CookieConsent'
import WaitlistModal from './components/overlays/WaitlistModal'
import { ThemeProvider } from './context/ThemeContext'
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
  const [waitlistOpen, setWaitlistOpen] = useState(false)

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
    <ThemeProvider defaultTheme="dark">
      <div className="min-h-screen overflow-x-clip" style={{ background: 'var(--color-bg)' }}>
        <SiteHeader onTryOro={() => setWaitlistOpen(true)} />
        <main id="main">
          {route.type === 'newsletter' ? (
            <Suspense fallback={null}>
              <NewsletterPage slug={route.slug} />
            </Suspense>
          ) : (
            <>
              {/* Redesign, section-by-section: Hero is live; NewsletterSection
                  + SiteFooter are still the old design until their turn. */}
              <Hero onTryOro={() => setWaitlistOpen(true)} />
              <NewsletterSection />
              <SiteFooter onTryOro={() => setWaitlistOpen(true)} />
            </>
          )}
        </main>
        <CookieConsent />
        {waitlistOpen && <WaitlistModal onClose={() => setWaitlistOpen(false)} />}
      </div>
    </ThemeProvider>
  )
}

export default App
