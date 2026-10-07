import { lazy, Suspense, useEffect } from 'react'
import { isFeedbackPath } from './lib/feedbackSession.js'
import { getBetaCampaign } from './lib/betaCampaign.js'
import { GEO_PATHS } from './lib/geoRoutes.js'
import Home from './components/home/Home'
import { HomeHeader, HomeFooter } from './components/home/HomeChrome'
import SiteHeader from './components/layout/SiteHeader'
import BlogSkeleton from './components/blog/BlogSkeleton'
import CookieConsent from './components/overlays/CookieConsent'
import { ThemeProvider } from './context/ThemeContext'
import { hasAnalyticsConsent, initAnalytics, trackPageNavigation, trackPageView, trackSocialLinkClick } from './lib/analytics'

// Code-split the article + archive + product-subpage routes.
const NewsletterPage = lazy(() => import('./components/newsletter/NewsletterPage'))
const JournalPage = lazy(() => import('./components/journal/JournalPage'))
const TryOroPage = lazy(() => import('./components/try-oro/TryOro'))
const HowItWorksPage = lazy(() => import('./components/how-it-works/HowItWorks'))
const WhyOroPage = lazy(() => import('./components/why-oro/WhyOro'))
const ManifestoPage = lazy(() => import('./components/manifesto/Manifesto'))
const ContactPage = lazy(() => import('./components/contact/Contact'))
const AboutPage = lazy(() => import('./components/about/AboutPage'))
const GetStartedPage = lazy(() => import('./components/get-started/GetStarted'))
const TesterReferrals = lazy(() => import('./components/beta/TesterReferrals'))
const BetaPage = lazy(() => import('./components/beta/Beta'))
const FeedbackPage = lazy(() => import('./components/feedback/Feedback'))
const GeoPage = lazy(() => import('./components/geo/GeoPage'))

export function getRouteFromPath(pathname = '/', search = '') {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (GEO_PATHS.includes(path)) return { type: 'geo', path }
  if (isFeedbackPath(path)) return { type: 'feedback' }
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
  if (path === '/about')           return { type: 'about' }
  if (path === '/get-started')     return { type: 'get-started' }
  if (path === '/signup')          return { type: 'signup' }
  if (path === '/tester/referrals') return { type: 'beta', tester: true }
  if (['/beta', '/invite', '/beta/career', '/beta/dating'].includes(path)) return { type: 'beta', campaign: getBetaCampaign(path, search) }

  return { type: 'home' }
}

function getBrowserRoute() {
  if (typeof window === 'undefined') return { type: 'home' }
  return getRouteFromPath(window.location.pathname, window.location.search)
}

function App({ initialRoute }) {
  const route = initialRoute || getBrowserRoute()
  const isHome = route.type === 'home'
  const isBeta = route.type === 'beta'
  const isSignup = route.type === 'signup'
  const isFeedback = route.type === 'feedback'
  const isGeo = route.type === 'geo'
  const isBlog = route.type === 'newsletter' || route.type === 'journal' || route.type === 'about' || isGeo
  const isPrivateForm = isBeta || isSignup || isFeedback || route.type === 'get-started'
  const isHalo = isHome || isPrivateForm || route.type === 'journal' || route.type === 'contact' || route.type === 'about' || route.type === 'newsletter' || isGeo
  const pageViewParams = {
    route_type: route.type,
    ...(route.slug ? { newsletter_slug: route.slug } : {}),
  }

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      initAnalytics()
      trackPageView(pageViewParams)
    }
  }, [route.slug, route.type])

  useEffect(() => {
    const handleLinkClick = (event) => {
      const link = event.target.closest?.('a[href]')
      if (!link) return

      const href = link.getAttribute('href')
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('sms:')) return

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
      <div className={`oro-editorial ${isBlog ? '' : 'oro-lowercase'} ${isHalo ? 'oro-theme halo-site' : 'min-h-screen overflow-x-clip'}`} style={isHalo ? undefined : { background: 'var(--color-bg)' }}>
        {isHalo && <a className="halo-skip-link" href="#main">Skip to content</a>}
        {!isBeta && !isSignup && !isFeedback && (isHalo ? <HomeHeader /> : <SiteHeader />)}
        <main id="main" tabIndex={-1}>
          {isGeo ? (
            <Suspense fallback={null}><GeoPage path={route.path} /></Suspense>
          ) : isFeedback ? (
            <Suspense fallback={null}><FeedbackPage /></Suspense>
          ) : isBeta || isSignup ? (
            <Suspense fallback={null}>
              {route.tester ? <TesterReferrals /> : <BetaPage campaign={route.campaign || 'general'} landing={isBeta} />}
            </Suspense>
          ) : route.type === 'newsletter' ? (
            <Suspense fallback={<BlogSkeleton variant="article" />}>
              <NewsletterPage slug={route.slug} />
            </Suspense>
          ) : route.type === 'journal' ? (
            <Suspense fallback={<BlogSkeleton variant="archive" />}>
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
          ) : route.type === 'about' ? (
            <Suspense fallback={<BlogSkeleton variant="article" />}>
              <AboutPage />
            </Suspense>
          ) : route.type === 'get-started' ? (
            <Suspense fallback={null}>
              <GetStartedPage />
            </Suspense>
          ) : (
            <Home />
          )}
        </main>
        {isHalo && !isFeedback && !isBeta && !isSignup && <HomeFooter landing={isHome} />}
        <CookieConsent halo={isHalo} pageViewParams={pageViewParams} />
      </div>
    </ThemeProvider>
  )
}

export default App
