import { Cta } from '@oro/web'
import { useTheme } from '../../context/ThemeContext'
import { trackCtaClick } from '../../lib/analytics'
import Wordmark from './Wordmark'

// Site chrome on every route. The nav collapsed to a single CTA with the
// landing redesign: /get-started is the only conversion action, and the
// remaining destinations live in the footer.

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  )
}

export default function SiteHeader() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const goToGetStarted = () => {
    trackCtaClick('get_started_click', { location: 'header', destination: 'get_started' })
    window.location.assign('/get-started')
  }

  return (
    <header className="site-header">
      <a href="/" className="site-header-logo-link" aria-label="oro home">
        <Wordmark size="header" />
      </a>

      <div className="site-header-actions">
        <nav className="site-header-nav" aria-label="oro">
          <a href="/from-the-closet">from the closet</a>
        </nav>

        <button
          type="button"
          className="site-header-theme"
          onClick={toggleTheme}
          aria-label={`switch to ${nextTheme} mode`}
          title={`switch to ${nextTheme} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <Cta size="compact" inverse className="site-cta site-cta--header" onClick={goToGetStarted}>
          get started
        </Cta>
      </div>
    </header>
  )
}
