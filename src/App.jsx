import { lazy, Suspense, useEffect } from 'react'
import Home from './components/home/Home'
import SiteHeader from './components/layout/SiteHeader'
import SiteFooter from './components/layout/SiteFooter'
import CookieConsent from './components/overlays/CookieConsent'
import { ThemeProvider } from './context/ThemeContext'
import { hasAnalyticsConsent, initAnalytics, trackPageNavigation, trackPageView, trackSocialLinkClick } from './lib/analytics'

// Code-split the article + archive + signup routes.
const NewsletterPage = lazy(() => import('./components/newsletter/NewsletterPage'))
const JournalPage = lazy(() => import('./components/journal/JournalPage'))
const ContactPage = lazy(() => import('./components/contact/Contact'))
const GetStartedPage = lazy(() => import('./components/get-started/GetStarted'))

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
  if (path === '/contact')         return { type: 'contact' }
  if (path === '/get-started')     return { type: 'get-started' }

  return { type: 'home' }
}

function getBrowserRoute() {
  if (typeof window === 'undefined') return { type: 'home' }
  return getRouteFromPath(window.location.pathname)
}

function App({ initialRoute }) {
  const route = initialRoute || getBrowserRoute()

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
    <ThemeProvider defaultTheme="light">
      <div className="theme-shell min-h-screen overflow-x-clip" style={{ background: 'var(--color-bg)' }}>
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
          ) : route.type === 'contact' ? (
            <Suspense fallback={null}>
              <ContactPage />
            </Suspense>
          ) : route.type === 'get-started' ? (
            <Suspense fallback={null}>
              <GetStartedPage />
            </Suspense>
          ) : (
            <Home />
          )}
        </main>
        <SiteFooter />
        <CookieConsent />
      </div>
    </ThemeProvider>
  )
}

export default App
