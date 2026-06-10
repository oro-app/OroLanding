import { NAV_COLUMNS } from '../../lib/siteLinks'
import { trackCtaClick } from '../../lib/analytics'

// Redesigned site footer — theme-aware via --color-* tokens. The four link
// columns are driven by the shared NAV_COLUMNS data (same source the header
// dropdowns use), so footer and navbar are always identical.
function Arrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <img src="/static/oro-logo.png" alt="oro" className="site-footer-logo" />
          <p className="site-footer-tagline">
            the stylist that fits in your pocket.
          </p>
          <a
            className="site-footer-tryoro"
            href="/try-oro"
           
            rel="noopener noreferrer"
            onClick={() => {
              trackCtaClick('try_oro_click', {
                location: 'footer',
                destination: 'try_oro',
              })
            }}
          >
            try oro
            <Arrow />
          </a>
        </div>

        {NAV_COLUMNS.map((col) => (
          <div className="site-footer-col" key={col.head}>
            <div className="site-footer-colhead">{col.head}</div>
            {col.links.map((link) => (
              <a
                key={link.label}
                className="site-footer-link"
                href={link.href}
               
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 Oro Digital Inc.</span>
      </div>
    </footer>
  )
}
