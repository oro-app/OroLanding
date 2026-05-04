import './SiteHeader.css'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <a href="/" className="site-header-logo-link" aria-label="Oro home">
        <img src="/static/oro-logo.png" alt="Oro" className="site-header-logo" />
      </a>

      <nav className="site-header-icons" aria-label="Oro links">
        <a href="mailto:admin@buildingoro.ca" className="site-header-icon" aria-label="Email">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M2 7l10 7 10-7"/>
          </svg>
        </a>
        <a href="https://www.instagram.com/oro.wardrobe/" target="_blank" rel="noopener noreferrer" className="site-header-icon" aria-label="Instagram">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5"/>
            <circle cx="12" cy="12" r="4.5"/>
            <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/company/buildingoro/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="site-header-icon" aria-label="LinkedIn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="3"/>
            <path d="M7 10v7"/>
            <path d="M7 7v.01"/>
            <path d="M11 17v-4c0-1.1.9-2 2-2s2 .9 2 2v4"/>
            <path d="M11 10v7"/>
          </svg>
        </a>
      </nav>
    </header>
  )
}
