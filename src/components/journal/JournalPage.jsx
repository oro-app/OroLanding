import { useEffect, useRef, useState } from 'react'
import { newsletters } from '../../lib/newsletters'
import FeaturedLetter from '../closet/FeaturedLetter'
import Rack from '../closet/Rack'
import CareLabelSubscribe from '../closet/CareLabelSubscribe'
import './JournalPage.css'

// One-shot intersection-observer hook. Returns a [ref, revealed] tuple —
// revealed flips to true the first time the element crosses the threshold,
// then the observer disconnects. Used to scroll-trigger entrance animations
// for the featured letter, rack, and care label sections.
function useRevealOnScroll(threshold = 0.1) {
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

// /journal — "from the closet." A four-section editorial page that leans
// into the closet metaphor:
//   1. Hero       (kicker + italic-accent headline + right-column subhead)
//   2. Featured   (this week's letter — pre-rule + asymmetric card)
//   3. Rack       (hangers on hairline rods; the centerpiece visual)
//   4. CareLabel  (subscribe form styled as a fabric care label)
//
// Featured letter logic: always the latest released letter. `newsletters`
// (lib/newsletters.js) is already filtered to published issues whose date has
// arrived and sorted newest-first, so the featured slot is just the top of the
// list — when a new issue's date comes, it auto-becomes the featured one.
//
// (Route stays /journal — per-handoff rename to /from-the-closet was
// blocked since it requires header/footer updates that are out of scope
// for this branch.)

function pickFeatured(list) {
  return list[0]  // newest published, date-gated letter
}

export default function JournalPage() {
  const [featRef, featRevealed]  = useRevealOnScroll(0.15)
  const [rackRef, rackRevealed]  = useRevealOnScroll(0.05)
  const [careRef, careRevealed]  = useRevealOnScroll(0.2)

  const featured = pickFeatured(newsletters)
  const rest = newsletters.filter((n) => n.slug !== featured?.slug && !n.comingSoon)

  return (
    <div className="ftc">
      {/* 1. Hero */}
      <section className="ftc-hero">
        <div className="ftc-hero-inner">
          <div className="ftc-hero-left">
            <p className="ftc-kicker">letters &amp; notes from oro</p>
            <h1 className="ftc-title">
              from the<br />
              <span className="ftc-em">closet</span>.
            </h1>
          </div>
          <div className="ftc-hero-right">
            <p className="ftc-sub">
              for the fashion lovers, the outfit planners, the people with opinions about fabric. twice a week — and a rack of older notes you can flip through any time.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Featured letter */}
      <div ref={featRef} data-revealed={featRevealed ? 'true' : 'false'}>
        {featured && <FeaturedLetter letter={featured} />}
      </div>

      {/* 3. The rack — older letters */}
      <div ref={rackRef} data-revealed={rackRevealed ? 'true' : 'false'}>
        <Rack entries={rest} />
      </div>

      {/* 4. Care label subscribe */}
      <div ref={careRef} data-revealed={careRevealed ? 'true' : 'false'}>
        <CareLabelSubscribe />
      </div>
    </div>
  )
}
