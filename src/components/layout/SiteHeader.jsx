import { useTheme } from '../../context/ThemeContext'

// Redesigned site header — faithful to the handoff's shared.jsx → SiteHeader.
// Sticky, hairline bottom border, theme-aware via the --color-* tokens
// (plum/cream on dark, cream/ink on light). Self-contained: every nav link
// is a real <a href>, so the header works identically on every route
// without depending on a prop wired from App.jsx.
export default function SiteHeader() {
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
        {/* Page links mirror the footer's navigational sections
            (product + editorial + say-hi). Socials + legal stay in the
            footer only. */}
        <a href="/how-it-works" className="site-header-link" target="_blank" rel="noopener noreferrer">how it works</a>
        <a href="/why-oro" className="site-header-link" target="_blank" rel="noopener noreferrer">why oro</a>
        <a href="/journal" className="site-header-link" target="_blank" rel="noopener noreferrer">from the closet</a>
        <a href="/manifesto" className="site-header-link" target="_blank" rel="noopener noreferrer">manifesto</a>
        <a href="/contact" className="site-header-link" target="_blank" rel="noopener noreferrer">contact</a>

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
