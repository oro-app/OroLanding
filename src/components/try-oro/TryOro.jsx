import { useEffect, useState } from 'react'
import SiteFooter from '../layout/SiteFooter'
import AppStoreButtons from '../marketing/AppStoreButtons'
import PlayStoreSoonModal from '../marketing/PlayStoreSoonModal'
import WaitlistModal from '../overlays/WaitlistModal'
import { OroPhone } from '../marketing/OroPhone'
import wardrobeScreenshot from '../../assets/try-oro/wardrobe-mockup.jpg'
import { trackEvent } from '../../lib/analytics'
import './TryOro.css'

const PERKS = [
  { k: 'free to start',          v: 'no card required. sign up and start styling in under a minute.' },
  { k: 'styled for you, today',  v: 'every fit weighed against the weather, the occasion, your body, and what actually goes together.' },
  { k: 'virtual try-on',         v: 'see the fit on you before you commit. tap any look, see it on.' },
  { k: 'your closet, your fits', v: 'we never recommend a piece you don’t already own.' },
  { k: 'your inspo, your way',   v: 'save the references that move you. oro learns the eye, not the algorithm.' },
]

export default function TryOro() {
  const [playSoonOpen, setPlaySoonOpen] = useState(false)
  const [mailingOpen, setMailingOpen] = useState(false)

  useEffect(() => {
    const prev = document.title
    document.title = 'try oro'
    return () => { document.title = prev }
  }, [])

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
          </div>

          <div className="tryoro-hero-right">
            <div className="op-pair">
              <div className="op-pair-back">
                <OroPhone screen="styleme" width={252} rotate={-4.5} />
              </div>
              <div className="op-pair-front">
                <OroPhone
                  imageSrc={wardrobeScreenshot}
                  imageAlt="Oro app — your wardrobe, 24 pieces across upper, lower, shoes, and accessories"
                  width={296}
                  rotate={3}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tryoro-perks" aria-label="what you get">
        <div className="tryoro-perks-inner">
          {PERKS.map((p) => (
            <div className="tryoro-perk" key={p.k}>
              <div className="tryoro-perk-label">{p.k}</div>
              <div className="tryoro-perk-desc">{p.v}</div>
            </div>
          ))}
          {/* trailing hairline so the bottom row gets a divider too */}
          <div className="tryoro-perk-end" aria-hidden="true" />
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
