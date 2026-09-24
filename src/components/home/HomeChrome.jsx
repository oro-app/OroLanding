import { Text } from 'oro-kit'
import { trackCtaClick } from '../../lib/analytics'
import { FOOTER_LINKS } from '../../lib/siteLinks'

function Wordmark() {
  return <span className="oro-wordmark">oro<span className="halo-wordmark-dot">.</span></span>
}

export function HomeCta({ place, children, className = '' }) {
  return (
    <a href="/get-started" className={`oro-button oro-button--primary halo-cta halo-cta--${place} ${className}`}
      onClick={() => trackCtaClick('get_started_click', { location: place, destination: 'get_started' })}>
      {children}
      <svg className="halo-cta-arrow" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M3 13 13 3M3 3h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  )
}

export function HomeHeader() {
  return (
    <header className="halo-header">
      <div className="halo-container halo-header-inner">
        <a className="halo-logo-link" href="/" aria-label="oro home"><Wordmark /></a>
        <nav className="halo-nav" aria-label="oro">
          <a className="halo-nav-journal" href="/from-the-closet">From the closet</a>
          <HomeCta place="header">Get started</HomeCta>
        </nav>
      </div>
    </header>
  )
}

export function HomeFooter() {
  return (
    <footer className="halo-footer halo-container">
      <a className="halo-logo-link" href="/" aria-label="oro home"><Wordmark /></a>
      <nav className="halo-footer-links" aria-label="site">
        {FOOTER_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label[0].toUpperCase() + link.label.slice(1)}</a>)}
      </nav>
      <Text variant="support" muted>© 2026 Oro Digital Inc.</Text>
    </footer>
  )
}
