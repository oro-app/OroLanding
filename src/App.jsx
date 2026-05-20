import { lazy, Suspense, useEffect, useState } from 'react'
import Hero from './components/home/Hero'
import WhyOro from './components/home/WhyOro'
import TheFilm from './components/home/TheFilm'
import FitsByOro from './components/home/FitsByOro'
import Testimonials from './components/home/Testimonials'
import TheJournal from './components/home/TheJournal'
import OroInsiders from './components/home/OroInsiders'
import FinalCTA from './components/home/FinalCTA'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import CookieConsent from './components/overlays/CookieConsent'
import WaitlistModal from './components/overlays/WaitlistModal'
import { ThemeProvider } from './context/ThemeContext'
import { hasAnalyticsConsent, initAnalytics } from './lib/analytics'
import { APP_STORE_URL } from './lib/links'

// Code-split the article + archive routes — only fetched when needed.
const NewsletterPage = lazy(() => import('./components/newsletter/NewsletterPage'))
const JournalPage = lazy(() => import('./components/journal/JournalPage'))

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const newsletterMatch = path.match(/^\/newsletter\/([^/]+)$/)

  if (newsletterMatch) {
    return {
      type: 'newsletter',
      slug: decodeURIComponent(newsletterMatch[1]),
    }
  }

  if (path === '/journal') {
    return { type: 'journal' }
  }

  return { type: 'home' }
}

function App() {
  const route = getRoute()
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  // Every "try oro" CTA opens the App Store in a new tab. WaitlistModal is
  // still mounted for OroInsiders ("join our community") and for the
  // periodic newsletter-page signup popup — both genuine email-collection
  // surfaces, not "try the app" CTAs.
  const openAppStore = () => {
    window.open(APP_STORE_URL, '_blank', 'noopener,noreferrer')
  }

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
        <SiteHeader onTryOro={openAppStore} />
        <main id="main">
          {route.type === 'newsletter' ? (
            <Suspense fallback={null}>
              <NewsletterPage slug={route.slug} />
            </Suspense>
          ) : route.type === 'journal' ? (
            <Suspense fallback={null}>
              <JournalPage />
            </Suspense>
          ) : (
            <>
              {/* Redesign, section-by-section: Hero is live; NewsletterSection
                  + SiteFooter are still the old design until their turn. */}
              <Hero onTryOro={openAppStore} />
              <WhyOro />
              <TheFilm />
              <FitsByOro />
              <Testimonials />
              <TheJournal onSubscribe={() => setWaitlistOpen(true)} />
              <OroInsiders onApply={() => setWaitlistOpen(true)} />
              <FinalCTA onTryOro={openAppStore} />
              <SiteFooter onTryOro={openAppStore} />
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
