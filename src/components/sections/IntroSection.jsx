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
          <button
            className="hero-nav-cta"
            onClick={() => setOpen(true)}
          >
            Get early access
          </button>
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
            Oro creates outfits from <span className="hero-headline-accent">your style</span> with your clothes.
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
