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
import { hasAnalyticsConsent, initAnalytics, trackPageNavigation, trackPageView, trackSocialLinkClick } from './lib/analytics'
import { DISCORD_URL } from './lib/links'

// Code-split the article + archive + product-subpage routes.
const NewsletterPage = lazy(() => import('./components/newsletter/NewsletterPage'))
const JournalPage = lazy(() => import('./components/journal/JournalPage'))
const TryOroPage = lazy(() => import('./components/try-oro/TryOro'))
const HowItWorksPage = lazy(() => import('./components/how-it-works/HowItWorks'))
const WhyOroPage = lazy(() => import('./components/why-oro/WhyOro'))
const ManifestoPage = lazy(() => import('./components/manifesto/Manifesto'))
const ContactPage = lazy(() => import('./components/contact/Contact'))

export function getRouteFromPath(pathname = '/') {
  const path = pathname.replace(/\/+$/, '') || '/'
  const newsletterMatch = path.match(/^\/newsletter\/([^/]+)$/)

  if (newsletterMatch) {
    return {
      type: 'newsletter',
      slug: decodeURIComponent(newsletterMatch[1]),
    }
  }

  // Route slugs match the labels shown in the header/footer.
  if (path === '/from-the-closet') return { type: 'journal' }
  if (path === '/try-oro')         return { type: 'try-oro' }
  if (path === '/how-it-works')    return { type: 'how-it-works' }
  if (path === '/why-oro')         return { type: 'why-oro' }
  if (path === '/honestly')        return { type: 'manifesto' }
  if (path === '/contact')         return { type: 'contact' }

  return { type: 'home' }
}

function getBrowserRoute() {
  if (typeof window === 'undefined') return { type: 'home' }
  return getRouteFromPath(window.location.pathname)
}

function App({ initialRoute }) {
  const route = initialRoute || getBrowserRoute()
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  // Every "try oro" CTA now funnels to /try-oro - the page
  // pitches the perks and offers both stores. OroInsiders "join our
  // community" opens the Discord invite directly. WaitlistModal stays
  // mounted for the periodic newsletter-page signup popup and the
  // TheJournal mailing-list CTA, the two remaining email-collection
  // surfaces on the home flow.
  const openTryOro = () => {
    trackPageNavigation({
      to_path: '/try-oro',
      navigation_type: 'programmatic',
    })
    window.location.assign('/try-oro')
  }
  const openDiscord = () => {
    window.open(DISCORD_URL, '_blank', 'noopener,noreferrer')
  }

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initAnalytics()
      trackPageView({
        route_type: route.type,
        ...(route.slug ? { newsletter_slug: route.slug } : {}),
      })
    }
  }, [route.slug, route.type])

  useEffect(() => {
    const handleLinkClick = (event) => {
      const link = event.target.closest?.('a[href]')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return

      const destination = new URL(href, window.location.href)
      const destinationPath = `${destination.pathname}${destination.search}${destination.hash}`
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

      if (destination.href === window.location.href) return

      trackPageNavigation({
        to_path: destinationPath,
        destination_url: destination.href,
        link_text: link.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) || '',
        link_target: link.target || '_self',
        navigation_type: destination.origin === window.location.origin ? 'internal_link' : 'external_link',
        is_external: destination.origin !== window.location.origin,
        ...(currentPath === destinationPath ? { same_path: true } : {}),
      })

      if (destination.origin !== window.location.origin) {
        trackSocialLinkClick({
          destination_url: destination.href,
          link_text: link.textContent?.trim().replace(/\s+/g, ' ').slice(0, 120) || '',
          link_target: link.target || '_self',
          location: link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : 'page',
        })
      }
    }

    const handleLocationChange = () => {
      const nextRoute = getBrowserRoute()
      trackPageView({
        route_type: nextRoute.type,
        ...(nextRoute.slug ? { newsletter_slug: nextRoute.slug } : {}),
      })
    }

    document.addEventListener('click', handleLinkClick)
    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)

    return () => {
      document.removeEventListener('click', handleLinkClick)
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

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
        <SiteHeader />
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
          ) : route.type === 'why-oro' ? (
            <Suspense fallback={null}>
              <WhyOroPage />
            </Suspense>
          ) : route.type === 'manifesto' ? (
            <Suspense fallback={null}>
              <ManifestoPage />
            </Suspense>
          ) : route.type === 'contact' ? (
            <Suspense fallback={null}>
              <ContactPage />
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
              <SiteFooter />
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
