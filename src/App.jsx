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
import { DISCORD_URL } from './lib/links'

// Code-split the article + archive + product-subpage routes.
const NewsletterPage = lazy(() => import('./components/newsletter/NewsletterPage'))
const JournalPage = lazy(() => import('./components/journal/JournalPage'))
const TryOroPage = lazy(() => import('./components/try-oro/TryOro'))
const HowItWorksPage = lazy(() => import('./components/how-it-works/HowItWorks'))

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  const newsletterMatch = path.match(/^\/newsletter\/([^/]+)$/)

  if (newsletterMatch) {
    return {
      type: 'newsletter',
      slug: decodeURIComponent(newsletterMatch[1]),
    }
  }

  if (path === '/journal')        return { type: 'journal' }
  if (path === '/try-oro')        return { type: 'try-oro' }
  if (path === '/how-it-works')   return { type: 'how-it-works' }

  return { type: 'home' }
}

function App() {
  const route = getRoute()
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  // Every "try oro" CTA now funnels to /try-oro (in a new tab) — the page
  // pitches the perks and offers both stores. OroInsiders "join our
  // community" opens the Discord invite directly. WaitlistModal stays
  // mounted for the periodic newsletter-page signup popup and the
  // TheJournal mailing-list CTA, the two remaining email-collection
  // surfaces on the home flow.
  const openTryOro = () => {
    window.open('/try-oro', '_blank', 'noopener,noreferrer')
  }
  const openDiscord = () => {
    window.open(DISCORD_URL, '_blank', 'noopener,noreferrer')
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
        <SiteHeader onTryOro={openTryOro} />
        <main id="main">
          {route.type === 'newsletter' ? (
            <Suspense fallback={null}>
              <NewsletterPage slug={route.slug} />
            </Suspense>
          ) : route.type === 'journal' ? (
            <Suspense fallback={null}>
              <JournalPage />
            </Suspense>
          ) : route.type === 'try-oro' ? (
            <Suspense fallback={null}>
              <TryOroPage />
            </Suspense>
          ) : route.type === 'how-it-works' ? (
            <Suspense fallback={null}>
              <HowItWorksPage />
            </Suspense>
          ) : (
            <>
              <Hero onTryOro={openTryOro} />
              <WhyOro />
              <TheFilm />
              <FitsByOro />
              <Testimonials />
              <TheJournal onSubscribe={() => setWaitlistOpen(true)} />
              <OroInsiders onApply={openDiscord} />
              <FinalCTA onTryOro={openTryOro} />
              <SiteFooter onTryOro={openTryOro} />
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
