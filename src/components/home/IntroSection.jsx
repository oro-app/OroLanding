import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../../lib/analytics'
import { APP_STORE_URL } from '../../lib/links'
import './IntroSection.css'

export default function IntroSection() {
  const [loaded, setLoaded] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    // Double RAF ensures initial paint happens before transition starts
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setLoaded(true))
    )
    return () => cancelAnimationFrame(id)
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

          {/* App Store CTA */}
          <div
            className="hero-cta-row"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 1s cubic-bezier(0.22,1,0.36,1) 0.82s, transform 1.1s cubic-bezier(0.22,1,0.36,1) 0.82s',
            }}
          >
            <a
              className="hero-app-store-btn"
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('cta_click', { location: 'hero', destination: 'app_store' })}
            >
              Download on the App Store
            </a>
          </div>
        </div>

        <a className="hero-scroll" href="#newsletter" aria-label="Scroll to newsletter section">
          <svg className="hero-scroll-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5V18M7 13L12 18L17 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

    </>
  )
}
