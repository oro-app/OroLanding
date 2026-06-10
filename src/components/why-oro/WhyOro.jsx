import { useEffect, useRef, useState } from 'react'
import SiteFooter from '../layout/SiteFooter'
import { trackCtaClick } from '../../lib/analytics'
import heroPhoto from '../../assets/why-oro/wardrobe-day.jpg'
import './WhyOro.css'

// /why-oro — short editorial subpage. Three beats: hero, principles, CTA.
// Theme-aware via --color-* tokens. The home page also has a WhyOro
// section (src/components/home/WhyOro.jsx) — different component, same name
// because they answer the same question at different fidelities. In App.jsx
// this is imported as WhyOroPage to disambiguate.

const PRINCIPLES = [
  {
    label: 'set up in minutes.',
    body: 'tagging and categorizing every piece in your closet takes hours. with oro, you upload outfits you’ve worn and it figures out the rest.',
  },
  {
    label: 'the factors a good stylist would check.',
    body: 'colour theory, silhouette, occasion, weather, your personal taste, what works for your body — oro considers every variable a trained stylist would, in seconds.',
  },
  {
    label: 'no guessing how it’ll look.',
    body: 'most styling apps show you a flat-lay. oro can put the look on your body so you know exactly what you’re saying yes to.',
  },
  {
    label: 'no new clothes, unless you ask.',
    body: 'most ai stylists are shopping engines in disguise. oro recommends what you already own — the pieces you forgot about, in combinations you wouldn’t have tried.',
  },
  {
    label: 'you’re not a demographic.',
    body: 'oro doesn’t average you against a million strangers. it learns your closet, your week, the way you actually live. every pick is read against you.',
  },
  {
    label: 'it gets better every week.',
    body: 'oro ships updates constantly. what you tell us on monday tends to be in the product by friday.',
  },
]

// One-shot intersection-observer hook. Returns a [ref, revealed] tuple —
// revealed flips to true the first time the element crosses the threshold,
// then the observer disconnects so the animation doesn't replay on
// re-scroll. Re-used for the principles list + bottom CTA.
function useRevealOnScroll(threshold = 0.15) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || revealed) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          obs.disconnect()
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [revealed, threshold])
  return [ref, revealed]
}

export default function WhyOroPage() {
  const [principlesRef, principlesRevealed] = useRevealOnScroll(0.15)
  const [ctaRef, ctaRevealed] = useRevealOnScroll(0.4)

  useEffect(() => {
    const prev = document.title
    document.title = 'Why Oro?'
    return () => { document.title = prev }
  }, [])

  const handleTryOro = () => {
    trackCtaClick('cta_click', { location: 'why-oro', destination: 'try_oro' })
    window.open('/try-oro', '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="wy">
      <section className="wy-hero">
        <div className="wy-hero-inner">
          <div className="wy-hero-text">
            <h1 className="wy-title">
              the wardrobe is where the day <span className="wy-em">begins</span>.
            </h1>
            <p className="wy-sub">
              it’s also where most of the thinking happens: where you’re going, the weather, what you’ve worn this week, what colours and shapes suit you, what you feel like, what goes with what. oro does that thinking for you, so you just bring the taste.
            </p>
          </div>
          <div className="wy-hero-photo-wrap">
            <img
              className="wy-hero-photo"
              src={heroPhoto}
              alt=""
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section
        className="wy-principles"
        aria-label="why oro"
        ref={principlesRef}
        data-revealed={principlesRevealed ? 'true' : 'false'}
      >
        <div className="wy-principles-inner">
          {PRINCIPLES.map((p, i) => (
            <div className="wy-principle" key={p.label} style={{ '--reveal-i': i }}>
              <div className="wy-principle-label">{p.label}</div>
              <div className="wy-principle-body">{p.body}</div>
            </div>
          ))}
          {/* trailing hairline so the last row gets a divider beneath */}
          <div
            className="wy-principle-end"
            aria-hidden="true"
            style={{ '--reveal-i': PRINCIPLES.length }}
          />
        </div>
      </section>

      <section
        className="wy-cta"
        ref={ctaRef}
        data-revealed={ctaRevealed ? 'true' : 'false'}
      >
        <button type="button" className="wy-cta-btn" onClick={handleTryOro}>
          try oro
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </section>

      <SiteFooter />
    </main>
  )
}
