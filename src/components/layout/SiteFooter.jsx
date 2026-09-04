import { FOOTER_LINKS } from '../../lib/siteLinks'
import Wordmark from './Wordmark'

// Site chrome on every route. A single row rather than the old four-column
// grid, matching the landing's footer; it carries the destinations the header
// no longer does.
export default function SiteFooter({ currentRoute }) {
  return (
    <footer className="site-footer">
      <a className="site-footer-home" href="/" aria-label="oro home" aria-current={currentRoute === 'home' ? 'page' : undefined}>
        <Wordmark size="footer" />
      </a>

      <nav className="site-footer-links" aria-label="footer">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            rel="noopener noreferrer"
            aria-current={
              (currentRoute === 'journal' && link.href === '/from-the-closet') ||
              (currentRoute === 'contact' && link.href === '/contact')
                ? 'page'
                : undefined
            }
          >
            {link.label}
          </a>
        ))}
      </nav>

      <span className="site-footer-copy">© 2026 Oro Digital Inc.</span>
    </footer>
  )
}
