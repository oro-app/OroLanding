import { Text } from 'oro-kit'
import ButtonArrow from '../ButtonArrow'
import { trackCtaClick } from '../../lib/analytics'
import { FOOTER_LINKS } from '../../lib/siteLinks'

const styleGoals = [
  'plan better outfits',
  'look professional at work',
  'expand my wardrobe',
  'evolve my style',
  'wear my clothes more',
]

function HomeLogo() {
  return <img className="halo-logo" src="/oro-logo.webp" alt="oro" width="1672" height="941" decoding="async" />
}

export function HomeCta({ place, children, className = '' }) {
  return (
    <a href="/beta" className={`oro-button oro-button--primary halo-cta halo-cta--${place} ${className}`}
      onClick={() => trackCtaClick('get_started_click', { location: place, destination: 'beta' })}>
      {children}
      <ButtonArrow direction="up-right" className="halo-cta-arrow" />
    </a>
  )
}

export function HomeHeader() {
  return (
    <header className="halo-header">
      <div className="halo-container halo-header-inner">
        <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
        <nav className="halo-nav" aria-label="oro">
          <a className="halo-nav-journal" href="/from-the-closet">Blog</a>
          <HomeCta place="header">Get started</HomeCta>
        </nav>
      </div>
    </header>
  )
}

export function HomeFooter({ landing = false }) {
  if (!landing) {
    return (
      <footer className="halo-footer halo-container">
        <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
        <nav className="halo-footer-links" aria-label="Site footer">
          {FOOTER_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label[0].toUpperCase() + link.label.slice(1)}</a>)}
        </nav>
        <Text variant="support" muted>© 2026 Oro Digital Inc.</Text>
      </footer>
    )
  }

  return (
    <footer className="halo-footer halo-footer--landing">
      <div className="halo-container">
        <section className="halo-footer-goals" aria-labelledby="style-goal-title">
          <h2 id="style-goal-title">What’s your style goal?</h2>
          <div className="halo-footer-goal-options">
            {styleGoals.map((goal) => (
              <a key={goal} href="/beta?step=request"
                onClick={() => trackCtaClick('style_goal_click', { goal, location: 'footer', destination: 'beta_request', transport_type: 'beacon' })}>
                {goal}
              </a>
            ))}
          </div>
        </section>
        <div className="halo-footer-main">
          <div className="halo-footer-brand">
            <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
            <nav className="halo-footer-social" aria-label="Social and editorial">
              <a href="https://www.instagram.com/askoro.now" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/askoro" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9h3.6v12H3.4V9Zm5.7 0h3.5v1.6h.1a3.9 3.9 0 0 1 3.5-1.9c3.8 0 4.5 2.5 4.5 5.7V21h-3.6v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21H9.1V9Z" /></svg>
              </a>
              <a href="https://x.com/askoro_now" aria-label="X" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-7.5L5.5 22H2.4l7.3-8.4L2 2h6.2l4.3 6.8L18.9 2Zm-1.1 18h1.7L7.2 3.9H5.4L17.8 20Z" /></svg>
              </a>
              <a href="/from-the-closet" aria-label="From the closet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 6a2 2 0 1 1 2.7 1.9c-.5.2-.7.5-.7 1.1v1l9 6a1.6 1.6 0 0 1-.9 2.9H3.9A1.6 1.6 0 0 1 3 16l9-6" /></svg>
              </a>
            </nav>
          </div>
          <nav className="halo-footer-legal" aria-label="Legal">
            <h3>Legal</h3>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/cookies">Cookies</a>
          </nav>
        </div>
        <div className="halo-footer-bottom">
          <span>© 2026 Oro Digital Inc.</span>
          <span>Made w luv &lt;3</span>
        </div>
      </div>
    </footer>
  )
}
