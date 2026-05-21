import { useTheme } from '../../context/ThemeContext'

// Redesigned site header — faithful to the handoff's shared.jsx → SiteHeader.
// Sticky, hairline bottom border, theme-aware via the --color-* tokens
// (plum/cream on dark, cream/ink on light). The "try oro" button opens the
// existing WaitlistModal (onTryOro is wired from App; optional/guarded so
// routes that render the header without it — none currently — won't break).
export default function SiteHeader({ onTryOro }) {
  const { theme, setTheme } = useTheme()

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
        <a href="/#journal" className="site-header-link">from the closet</a>
        <a href="/manifesto" className="site-header-link" target="_blank" rel="noopener noreferrer">manifesto</a>

        <div className="theme-toggle" role="group" aria-label="Theme">
          <button
            type="button"
            className={`theme-toggle-btn${theme === 'dark' ? ' is-active' : ''}`}
            aria-pressed={theme === 'dark'}
            onClick={() => setTheme('dark')}
          >
            dark
          </button>
          <span className="theme-toggle-dot" aria-hidden="true">·</span>
          <button
            type="button"
            className={`theme-toggle-btn${theme === 'light' ? ' is-active' : ''}`}
            aria-pressed={theme === 'light'}
            onClick={() => setTheme('light')}
          >
            light
          </button>
        </div>

        <a
          href="https://www.instagram.com/oro.wardrobe/"
          target="_blank"
          rel="noopener noreferrer"
          className="site-header-ig"
          aria-label="instagram"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
          </svg>
        </a>

        <button type="button" className="site-header-tryoro" onClick={() => onTryOro?.()}>
          try oro
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </header>
  )
}
