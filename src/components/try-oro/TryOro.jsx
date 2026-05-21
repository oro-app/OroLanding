import { useEffect, useRef, useState } from 'react'
import SiteFooter from '../layout/SiteFooter'
import AppStoreButtons from '../marketing/AppStoreButtons'
import PlayStoreSoonModal from '../marketing/PlayStoreSoonModal'
import WaitlistModal from '../overlays/WaitlistModal'
import phoneHome from '../../assets/try-oro/phone-home.webp'
import phoneStyleme from '../../assets/try-oro/phone-styleme.webp'
import { trackEvent } from '../../lib/analytics'
import { USER_COUNT } from '../../lib/stats'
import './TryOro.css'

const PERKS = [
  { k: 'free to start',          v: 'no card required. sign up and start styling in under a minute.' },
  { k: 'styled for you, today',  v: 'every fit weighed against the weather, the occasion, your body, and what actually goes together.' },
  { k: 'virtual try-on',         v: 'see the fit on you before you commit. tap any look, see it on.' },
  { k: 'everything you already have', v: 'we never recommend a piece you don’t already own. sometimes you forget what you actually have.' },
  { k: 'built around your taste', v: 'show us your inspo. oro learns the eye, not the algorithm.' },
]

export default function TryOro() {
  const [playSoonOpen, setPlaySoonOpen] = useState(false)
  const [mailingOpen, setMailingOpen] = useState(false)
  const [perksRevealed, setPerksRevealed] = useState(false)
  const perksRef = useRef(null)

  useEffect(() => {
    const prev = document.title
    document.title = 'try oro'
    return () => { document.title = prev }
  }, [])

  // Reveal-on-scroll for the perks list. Once any part of the section is
  // ~15% in view, flip the data attribute and let CSS animate each row
  // in (hairline draws, label rises with a gold highlight pass, desc
  // fades). One-shot — we disconnect after the first hit so re-scrolling
  // doesn't replay.
  useEffect(() => {
    const el = perksRef.current
    if (!el || perksRevealed) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPerksRevealed(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [perksRevealed])

  const handlePlayStoreClick = () => {
    trackEvent('cta_click', { location: 'try-oro', destination: 'play_store_soon' })
    setPlaySoonOpen(true)
  }

  return (
    <main className="tryoro">
      <section className="tryoro-hero">
        <div className="tryoro-hero-inner">
          <div className="tryoro-hero-left">
            <h1 className="tryoro-title">
              try <span className="tryoro-em">oro</span>.
            </h1>
            <p className="tryoro-sub">
              live this week on iOS and Android. download, sign in, and we’ll have a fit for you in under a minute.
            </p>

            <div className="tryoro-stores">
              <AppStoreButtons onPlayStoreClick={handlePlayStoreClick} />
            </div>

            <p className="tryoro-micro">free to start.</p>
            <p className="tryoro-proof">join {USER_COUNT} people already getting dressed with oro.</p>
          </div>

          <div className="tryoro-hero-right">
            <div className="tryoro-phones">
              <img
                className="tryoro-phone tryoro-phone--back"
                src={phoneStyleme}
                alt="Oro app — style me input: where are you going? how many looks?"
                width="828" height="1712"
                loading="eager" decoding="async" draggable={false}
              />
              <img
                className="tryoro-phone tryoro-phone--front"
                src={phoneHome}
                alt="Oro app — good morning, kevin. yesterday's fit."
                width="828" height="1712"
                loading="eager" decoding="async" draggable={false}
              />
            </div>
          </div>
        </div>
      </section>

      <section
        className="tryoro-perks"
        aria-label="what you get"
        ref={perksRef}
        data-revealed={perksRevealed ? 'true' : 'false'}
      >
        <div className="tryoro-perks-inner">
          {PERKS.map((p, i) => (
            <div className="tryoro-perk" key={p.k} style={{ '--reveal-i': i }}>
              <div className="tryoro-perk-label">{p.k}</div>
              <div className="tryoro-perk-desc">{p.v}</div>
            </div>
          ))}
          {/* trailing hairline so the bottom row gets a divider too */}
          <div className="tryoro-perk-end" aria-hidden="true" style={{ '--reveal-i': PERKS.length }} />
        </div>
      </section>

      <SiteFooter />

      {playSoonOpen && (
        <PlayStoreSoonModal
          onClose={() => setPlaySoonOpen(false)}
          onMailingList={() => setMailingOpen(true)}
        />
      )}
      {mailingOpen && <WaitlistModal onClose={() => setMailingOpen(false)} />}
    </main>
  )
}
