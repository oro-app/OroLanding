import { useState, useEffect, useRef } from 'react'
import WaitlistModal from './WaitlistModal'
import './IntroSection.css'

export default function IntroSection() {
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true))
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
            transform: loaded ? 'translateY(0)' : 'translateY(-12px)',
            transition: 'opacity 0.9s ease-out 0.1s, transform 0.9s ease-out 0.1s',
          }}
        >
          <img src="/static/oro-logo.png" alt="Oro" className="hero-nav-logo" />
          <div className="hero-nav-icons">
            <a href="mailto:admin@buildingoro.ca" className="hero-nav-icon" aria-label="Email">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
            <a href="https://www.instagram.com/oro.wardrobe/" target="_blank" rel="noopener noreferrer" className="hero-nav-icon" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </a>
            <a href="https://www.linkedin.com/company/buildingoro/" target="_blank" rel="noopener noreferrer" className="hero-nav-icon" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
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
              transform: loaded ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 1s ease-out 0.2s, transform 1s ease-out 0.2s',
            }}
          >
            Creates outfits from <span className="hero-headline-accent">your style</span> with your clothes.
          </h1>

          <p
            className="hero-subtitle"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 1s ease-out 0.45s, transform 1s ease-out 0.45s',
            }}
          >
            Style is subjective. Getting dressed shouldn't be hard. Using your own clothes and your own taste, we make it easy.
          </p>

          {/* Inline waitlist */}
          <div
            className="hero-waitlist-row"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 1s ease-out 0.6s, transform 1s ease-out 0.6s',
            }}
          >
            <button
              className="hero-waitlist-btn"
              onClick={() => setOpen(true)}
            >
              Join the Waitlist
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="hero-scroll"
          style={{
            opacity: loaded ? 0.35 : 0,
            transition: 'opacity 1s ease-out 0.9s',
          }}
        >
          <span className="hero-scroll-label">Scroll</span>
          <div className="hero-scroll-line" />
        </div>
      </section>

      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}
