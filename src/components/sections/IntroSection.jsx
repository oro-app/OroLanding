import { useState, useEffect, useRef } from 'react'
import WaitlistModal from './WaitlistModal'
import { trackEvent } from '../../lib/analytics'
import './IntroSection.css'

export default function IntroSection() {
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    // Double RAF ensures initial paint happens before transition starts
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setLoaded(true))
    )
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    if (window.location.hash.includes('access_token')) {
      setOpen(true)
    }
  }, [])

  return (
    <>
      <section
        id="intro"
        ref={heroRef}
        className="hero-section"
      >
        {/* Soft radial glow */}
        <div className="hero-glow" />

        {/* Nav */}
        <nav
          className="hero-nav"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(-16px)',
            transition: 'opacity 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s, transform 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s',
          }}
        >
          <img src="/static/oro-logo.png" alt="Oro" className="hero-nav-logo" />
          <div className="hero-nav-icons">
            <a href="mailto:admin@buildingoro.ca" className="hero-nav-icon" aria-label="Email">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 7l10 7 10-7"/>
              </svg>
            </a>
            <a href="https://www.instagram.com/oro.wardrobe/" target="_blank" rel="noopener noreferrer" className="hero-nav-icon" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="4.5"/>
                <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/buildingoro/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="hero-nav-icon" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="3"/>
                <path d="M7 10v7"/>
                <path d="M7 7v.01"/>
                <path d="M11 17v-4c0-1.1.9-2 2-2s2 .9 2 2v4"/>
                <path d="M11 10v7"/>
              </svg>
            </a>
          </div>
        </nav>

        {/* Headline */}
        <div className="hero-content">
          <h1
            className="hero-headline"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(40px)',
              transition: 'opacity 1s cubic-bezier(0.22,1,0.36,1) 0.35s, transform 1.1s cubic-bezier(0.22,1,0.36,1) 0.35s',
            }}
          >
            Create outfits from <span className="hero-headline-accent">your style</span> with your clothes.
          </h1>

          <p
            className="hero-subtitle"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 1s cubic-bezier(0.22,1,0.36,1) 0.6s, transform 1.1s cubic-bezier(0.22,1,0.36,1) 0.6s',
            }}
          >
            Style is subjective. Looking good shouldn't be hard. Using your own clothes and your own taste, we make it easy.
          </p>

          {/* Inline waitlist */}
          <div
            className="hero-waitlist-row"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 1s cubic-bezier(0.22,1,0.36,1) 0.82s, transform 1.1s cubic-bezier(0.22,1,0.36,1) 0.82s',
            }}
          >
            <button
              className="hero-waitlist-btn"
              onClick={() => { trackEvent('cta_click', { location: 'hero' }); setOpen(true); }}
            >
              Join the Waitlist
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="hero-footer">
          <span className="hero-footer-copy">&copy; 2026 Oro Digital Inc. All rights reserved.</span>
          <div className="hero-footer-links">
            <a href="/terms" className="hero-footer-link" target="_blank" rel="noopener noreferrer">Terms of Service</a>
            <span className="hero-footer-sep">·</span>
            <a href="/privacy" className="hero-footer-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <span className="hero-footer-sep">·</span>
            <a href="/cookies" className="hero-footer-link" target="_blank" rel="noopener noreferrer">Cookie Policy</a>
          </div>
        </footer>
      </section>

      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}
