import { useTheme } from '../../context/ThemeContext'
import { NAV_COLUMNS } from '../../lib/siteLinks'

// Redesigned site header — sticky, hairline bottom border, theme-aware via
// --color-* tokens. The nav mirrors the footer exactly: each footer column
// (product / editorial / say hi / legal) is a hover/focus dropdown here,
// driven by the shared NAV_COLUMNS data so the two never drift apart.
//
// Theme control is a single sun/moon icon toggle (was two literal
// dark / light text buttons).

function SunIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </svg>
  )
}

function NavArrow() {
  return (
    <svg className="site-header-caret" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export default function SiteHeader() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <header className="site-header">
      <a href="/" className="site-header-logo-link" aria-label="oro home">
        <img
          src="/static/oro-logo.png"
          alt="oro"
          className="site-header-logo"
          fetchpriority="high"
          decoding="async"
        />
      </a>

      <nav className="site-header-nav" aria-label="oro">
        {NAV_COLUMNS.map((col) => (
          <div className="site-header-group" key={col.head}>
            <button type="button" className="site-header-group-trigger" aria-haspopup="true">
              {col.head}
              <NavArrow />
            </button>
            <div className="site-header-menu" role="menu">
              {col.links.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="site-header-menu-link"
                  role="menuitem"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="site-header-theme"
          onClick={toggleTheme}
          aria-label={`switch to ${nextTheme} mode`}
          title={`switch to ${nextTheme} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <a
          href="/try-oro"
          target="_blank"
          rel="noopener noreferrer"
          className="site-header-tryoro"
        >
          try oro
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </nav>
    </header>
  )
}
