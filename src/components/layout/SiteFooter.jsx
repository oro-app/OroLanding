import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <span className="site-footer-copy">Copyright 2026 Oro Digital Inc. All rights reserved.</span>
      <div className="site-footer-links">
        <a href="/terms" className="site-footer-link" target="_blank" rel="noopener noreferrer">Terms of Service</a>
        <span className="site-footer-sep" aria-hidden="true">/</span>
        <a href="/privacy" className="site-footer-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        <span className="site-footer-sep" aria-hidden="true">/</span>
        <a href="/cookies" className="site-footer-link" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
      </div>
    </footer>
  )
}
