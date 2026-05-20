import { useEffect } from 'react'
import { newsletters } from '../../lib/newsletters'
import SiteFooter from '../layout/SiteFooter'
import FeaturedLetter from '../closet/FeaturedLetter'
import Rack from '../closet/Rack'
import CareLabelSubscribe from '../closet/CareLabelSubscribe'
import './JournalPage.css'

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
              a slow read on style, mornings, and the small group of people we’re building oro with. one letter, once a month — and a rack of older notes you can flip through any time.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Featured letter */}
      {featured && <FeaturedLetter letter={featured} />}

      {/* 3. The rack — older letters */}
      <Rack entries={rest} />

      {/* 4. Care label subscribe */}
      <CareLabelSubscribe />

      <SiteFooter />
    </main>
  )
}
