import { FOOTER_LINKS } from '../../lib/siteLinks'
import Wordmark from './Wordmark'

// Site chrome on every route. A single row rather than the old four-column
// grid, matching the landing's footer; it carries the destinations the header
// no longer does.
export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <a href="/" aria-label="oro home">
        <Wordmark size="footer" />
      </a>

      <nav className="site-footer-links" aria-label="site">
        {FOOTER_LINKS.map((link) => (
          <a key={link.label} href={link.href} rel="noopener noreferrer">
            {link.label}
          </a>
        ))}
      </nav>

      <span className="site-footer-copy">© 2026 Oro Digital Inc.</span>
    </footer>
  )
}
