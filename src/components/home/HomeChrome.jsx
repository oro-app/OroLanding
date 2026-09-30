import { Text } from 'oro-kit'
import useScrolled from '../../hooks/useScrolled'
import { trackCtaClick } from '../../lib/analytics'
import { FOOTER_LINKS } from '../../lib/siteLinks'

function HomeLogo() {
  return <img className="halo-logo" src="/oro-logo.webp" alt="oro" width="1672" height="941" decoding="async" />
}

export function HomeCta({ place, children, className = '' }) {
  return (
    <a href="/beta" className={`oro-button oro-button--primary halo-cta halo-cta--${place} ${className}`}
      onClick={() => trackCtaClick('get_started_click', { location: place, destination: 'beta' })}>
      {children}
    </a>
  )
}

export function HomeHeader() {
  const scrolled = useScrolled()

  return (
    <header className={`halo-header${scrolled ? ' halo-header--scrolled' : ''}`}>
      <div className="halo-container halo-header-inner">
        <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
        <nav className="halo-nav" aria-label="oro">
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
