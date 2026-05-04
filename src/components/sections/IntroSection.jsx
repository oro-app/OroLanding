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

      </section>

      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </>
  )
}
