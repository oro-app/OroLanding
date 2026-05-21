// Redesigned site footer — faithful to the handoff's shared.jsx → SiteFooter.
// Theme-aware via --color-* tokens. Self-contained: every link is a real
// <a href>, so the footer works on every route without depending on a prop
// wired from App.jsx (which only happened on the home route before, leaving
// the 'try oro' buttons inert on subpages).
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
            target="_blank"
            rel="noopener noreferrer"
          >
            try oro
            <Arrow />
          </a>
        </div>

        <div className="site-footer-col">
          <div className="site-footer-colhead">product</div>
          <a className="site-footer-link" href="/try-oro" target="_blank" rel="noopener noreferrer">try oro</a>
          <a className="site-footer-link" href="/how-it-works" target="_blank" rel="noopener noreferrer">how it works</a>
          <a className="site-footer-link" href="/why-oro" target="_blank" rel="noopener noreferrer">why oro</a>
        </div>

        <div className="site-footer-col">
          <div className="site-footer-colhead">editorial</div>
          <a className="site-footer-link" href="/journal" target="_blank" rel="noopener noreferrer">from the closet</a>
          <a className="site-footer-link" href="/manifesto" target="_blank" rel="noopener noreferrer">manifesto</a>
        </div>

        <div className="site-footer-col">
          <div className="site-footer-colhead">say hi.</div>
          <a className="site-footer-link" href="/contact" target="_blank" rel="noopener noreferrer">contact &amp; help</a>
          <a className="site-footer-link" href="mailto:admin@buildingoro.ca" target="_blank" rel="noopener noreferrer">admin@buildingoro.ca</a>
          <a className="site-footer-link" href="https://www.instagram.com/oro.wardrobe/" target="_blank" rel="noopener noreferrer">instagram</a>
          <a className="site-footer-link" href="https://www.tiktok.com/@oro.wardrobe" target="_blank" rel="noopener noreferrer">tiktok</a>
          <a className="site-footer-link" href="https://www.linkedin.com/company/buildingoro/" target="_blank" rel="noopener noreferrer">linkedin</a>
          <a className="site-footer-link" href="https://linktr.ee/buildingoro" target="_blank" rel="noopener noreferrer">linktree</a>
        </div>

        <div className="site-footer-col">
          <div className="site-footer-colhead">legal</div>
          <a className="site-footer-link" href="/terms" target="_blank" rel="noopener noreferrer">terms</a>
          <a className="site-footer-link" href="/privacy" target="_blank" rel="noopener noreferrer">privacy</a>
          <a className="site-footer-link" href="/cookies" target="_blank" rel="noopener noreferrer">cookies</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 Oro Digital Inc.</span>
      </div>
    </footer>
  )
}
