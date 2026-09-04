import { forMode, radii } from '@oro/tokens'
import { Button } from '@oro/ui'
import { Cta } from '@oro/web'
import { useTheme } from '../../context/ThemeContext'
import { trackCtaClick } from '../../lib/analytics'
import Wordmark from './Wordmark'

// Site chrome on every route. The nav collapsed to a single CTA with the
// landing redesign: /get-started is the only conversion action, and the
// remaining destinations live in the footer.

function SunIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  )
}

function MoonIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  )
}

export default function SiteHeader({ currentRoute }) {
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const handleGetStarted = () => {
    trackCtaClick('get_started_click', { location: 'header', destination: 'get_started' })
  }

  return (
    <header className="site-header">
      <a href="/" className="site-header-logo-link" aria-label="oro home" aria-current={currentRoute === 'home' ? 'page' : undefined}>
        <Wordmark size="header" />
      </a>

      <div className="site-header-actions">
        <nav className="site-header-nav" aria-label="primary">
          <Cta size="compact" className="site-header-editorial" href="/from-the-closet" aria-current={currentRoute === 'journal' ? 'page' : undefined}>
            newsletter
          </Cta>
        </nav>

        <div className="site-header-theme" style={{ '--site-header-theme-hover': forMode(theme).hoverTint }}>
          <Button
            label={`switch to ${nextTheme} mode`}
            variant="secondary"
            size="sm"
            tone={theme === 'dark' ? 'onDark' : 'light'}
            content="iconOnly"
            style={{ width: 'auto', height: 'auto', borderRadius: radii.pill, paddingHorizontal: 9, paddingVertical: 9 }}
            icon={theme === 'dark'
              ? <SunIcon color={forMode(theme).secondaryActionIcon} />
              : <MoonIcon color={forMode(theme).secondaryActionIcon} />}
            onPress={() => setTheme(nextTheme)}
          />
        </div>

        <nav className="site-header-conversion" aria-label="get started">
          <Cta
            size="compact"
            inverse
            className="site-cta site-cta--header"
            href="/get-started"
            onClick={handleGetStarted}
            aria-current={currentRoute === 'get-started' ? 'page' : undefined}
          >
            <span className="site-header-cta-label">get started</span>
          </Cta>
        </nav>
      </div>
    </header>
  )
}
