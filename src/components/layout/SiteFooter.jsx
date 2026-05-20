// Redesigned site footer — faithful to the handoff's shared.jsx → SiteFooter.
// Theme-aware via --color-* tokens (plum/cream on dark, cream/ink on light):
// same layout in both themes, only the colour differs.
//
// onTryOro is optional/guarded: App passes it on the home route; NewsletterPage
// renders <SiteFooter/> without it, so the footer "try oro" is inert there
// (no regression — the old footer had no try-oro at all).
function Arrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

export default function SiteFooter({ onTryOro }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <img src="/static/oro-logo.png" alt="oro" className="site-footer-logo" />
          <p className="site-footer-tagline">
            the stylist that fits in your pocket.
          </p>
          <button type="button" className="site-footer-tryoro" onClick={() => onTryOro?.()}>
            try oro
            <Arrow />
          </button>
        </div>

        <div className="site-footer-col">
          <div className="site-footer-colhead">product</div>
          <button type="button" className="site-footer-link" onClick={() => onTryOro?.()}>try oro</button>
          <a className="site-footer-link" href="/how-it-works" target="_blank" rel="noopener noreferrer">how it works</a>
          <a className="site-footer-link" href="/#whyoro">why oro</a>
        </div>

        <div className="site-footer-col">
          <div className="site-footer-colhead">oro</div>
          <a className="site-footer-link" href="/#journal">from the closet</a>
        </div>

        <div className="site-footer-col">
          <div className="site-footer-colhead">say hi.</div>
          <a className="site-footer-link" href="mailto:admin@buildingoro.ca" target="_blank" rel="noopener noreferrer">admin@buildingoro.ca</a>
          <a className="site-footer-link" href="https://www.instagram.com/oro.wardrobe/" target="_blank" rel="noopener noreferrer">instagram</a>
          <a className="site-footer-link" href="https://www.tiktok.com/@oro.wardrobe" target="_blank" rel="noopener noreferrer">tiktok</a>
          <a className="site-footer-link" href="https://www.linkedin.com/company/buildingoro/" target="_blank" rel="noopener noreferrer">linkedin</a>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 oro digital inc.</span>
        <div className="site-footer-legal">
          <a href="/terms" target="_blank" rel="noopener noreferrer">terms</a>
          <span className="site-footer-sep" aria-hidden="true">/</span>
          <a href="/privacy" target="_blank" rel="noopener noreferrer">privacy</a>
          <span className="site-footer-sep" aria-hidden="true">/</span>
          <a href="/cookies" target="_blank" rel="noopener noreferrer">cookies</a>
        </div>
        <span className="site-footer-place">toronto / waterloo — 2026</span>
      </div>
    </footer>
  )
}
