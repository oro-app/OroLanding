import { useEffect, useRef, useState } from 'react'
import { newsletters } from '../../lib/newsletters'
import SiteFooter from '../layout/SiteFooter'
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
// Featured letter logic: for the launch, pin to the bespoke
// 'what-we-mean-by-closet' piece if present (it's the namesake intro).
// After that, fall through to "latest newsletter by date".
//
// (Route stays /journal — per-handoff rename to /from-the-closet was
// blocked since it requires header/footer updates that are out of scope
// for this branch.)

const LAUNCH_SLUG = 'what-we-mean-by-closet'

function pickFeatured(list) {
  const launch = list.find((n) => n.slug === LAUNCH_SLUG)
  if (launch) return launch
  return list[0]  // newsletters is already sorted desc by date
}

export default function JournalPage() {
  const [featRef, featRevealed]  = useRevealOnScroll(0.15)
  const [rackRef, rackRevealed]  = useRevealOnScroll(0.05)
  const [careRef, careRevealed]  = useRevealOnScroll(0.2)

  useEffect(() => {
    const prev = document.title
    document.title = 'oro — from the closet'
    return () => { document.title = prev }
  }, [])

  const featured = pickFeatured(newsletters)
  const rest = newsletters.filter((n) => n.slug !== featured?.slug)

  return (
    <main className="ftc">
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
              a slow read on style, mornings, and the small group of people we’re building oro with. one letter, twice a week — and a rack of older notes you can flip through any time.
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

      <SiteFooter />
    </main>
  )
}
