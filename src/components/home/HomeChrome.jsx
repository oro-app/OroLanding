import { Text } from 'oro-kit'
import { trackCtaClick } from '../../lib/analytics'
import { FOOTER_LINKS } from '../../lib/siteLinks'

function HomeLogo() {
  return <img className="halo-logo" src="/static/oro-logo.png" alt="oro" width="80" height="32" decoding="async" />
}

export function HomeCta({ place, children, className = '' }) {
  return (
    <a href="/beta" className={`oro-button oro-button--primary halo-cta halo-cta--${place} ${className}`}
      onClick={() => trackCtaClick('get_started_click', { location: place, destination: 'beta' })}>
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
        <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
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
      <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
      <nav className="halo-footer-links" aria-label="site">
        {FOOTER_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label[0].toUpperCase() + link.label.slice(1)}</a>)}
      </nav>
      <Text variant="support" muted>© 2026 Oro Digital Inc.</Text>
    </footer>
  )
}
