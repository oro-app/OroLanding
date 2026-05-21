import { useEffect } from 'react'
import SiteFooter from '../layout/SiteFooter'
import wardrobePhoto from '../../assets/why-oro/wardrobe-day.jpg'
import editorialPhoto from '../../assets/hero/hero-fit.jpg'
import polaroidPhoto from '../../assets/fits/mon.jpg'
import './Manifesto.css'

// /manifesto — "six things we believe." A curated pinboard above someone's
// desk: polaroids, an index card, a torn page (with gold highlighter), an
// ivory sticky, a long taped note, and a dark ink card — 8 items pinned
// to a plum-deep cork with brass tacks at varied angles and deliberate
// overlaps.
//
// Six beliefs are LOCKED-IN copy per the handoff. Don't reorder, don't
// substitute synonyms, don't add a 7th.

function Pin({ leftPct = '50%' }) {
  // The brass tack — radial gradient + inset shadow gives it the 3D look.
  // Positioned via inline `left` so individual items (notably item 1, which
  // wants a 40% pin) can override.
  return <span className="mn-pin" style={{ left: leftPct }} aria-hidden="true" />
}

function Tape() {
  // Two translucent paper-tape strips on the top corners (item 6 only —
  // it has no pushpin).
  return (
    <>
      <span className="mn-tape mn-tape--left" aria-hidden="true" />
      <span className="mn-tape mn-tape--right" aria-hidden="true" />
    </>
  )
}

export default function Manifesto() {
  useEffect(() => {
    const prev = document.title
    document.title = 'manifesto — oro'
    return () => { document.title = prev }
  }, [])

  return (
    <main className="mn">
      {/* Title block */}
      <section className="mn-title-wrap">
        <p className="mn-kicker">
          <span className="mn-kicker-dot" aria-hidden="true" />
          the manifesto.
        </p>
        <h1 className="mn-title">
          6 takes we <span className="mn-em">live by</span>.
        </h1>
      </section>

      {/* The pinboard — 920px tall, 8 absolutely positioned items */}
      <section className="mn-board-wrap">
        <div className="mn-board">

          {/* 1. Polaroid (closet photo, decorative) */}
          <div
            className="mn-item mn-item--polaroid"
            style={{ top: 16, left: 24, width: 240, transform: 'rotate(-4deg)' }}
          >
            <Pin leftPct="40%" />
            <div
              className="mn-polaroid-photo"
              style={{ backgroundImage: `url(${wardrobePhoto})` }}
              aria-hidden="true"
            />
          </div>

          {/* 2. Typed index card — belief 01 */}
          <div
            className="mn-item mn-item--index"
            style={{ top: 64, left: 230, width: 340, transform: 'rotate(2deg)' }}
          >
            <Pin />
            <p className="mn-label mn-label--plum">take 01.</p>
            <p className="mn-belief mn-belief--ink">
              the best thing in your wardrobe might be something you haven’t worn in <span className="mn-italic-plum">two years.</span>
            </p>
          </div>

          {/* 3. Torn page — belief 03 (full gold highlight, italic body) */}
          <div
            className="mn-item mn-item--torn"
            style={{ top: 320, left: 24, width: 320, transform: 'rotate(-2deg)' }}
          >
            <Pin />
            <p className="mn-label mn-label--plum">take 03.</p>
            <p className="mn-belief mn-belief--ink mn-belief--italic">
              <span className="mn-highlight">nobody can tell you what your style is. they can only help you see it.</span>
            </p>
          </div>

          {/* 4. Editorial photo (decorative) */}
          <div
            className="mn-item mn-item--photo"
            style={{ top: 290, left: 320, width: 300, transform: 'rotate(3deg)' }}
          >
            <Pin />
            <div
              className="mn-photo-inner"
              style={{ backgroundImage: `url(${editorialPhoto})` }}
              aria-hidden="true"
            />
          </div>

          {/* 5. Polaroid with caption — belief 05 */}
          <div
            className="mn-item mn-item--polaroid mn-item--polaroid-cap"
            style={{ top: 16, right: 24, width: 240, transform: 'rotate(4deg)' }}
          >
            <Pin />
            <div
              className="mn-polaroid-photo"
              style={{ backgroundImage: `url(${polaroidPhoto})` }}
              aria-hidden="true"
            />
            <p className="mn-polaroid-caption">
              a great outfit is a small joy.<br />
              and small joys <span className="mn-italic-plum">add up.</span>
            </p>
          </div>

          {/* 6. Long taped note — belief 02 (paper tape, no pushpin) */}
          <div
            className="mn-item mn-item--taped"
            style={{ top: 360, right: 16, width: 380, transform: 'rotate(-1deg)' }}
          >
            <Tape />
            <p className="mn-label mn-label--plum">take 02.</p>
            <p className="mn-belief mn-belief--ink">
              a million data points from strangers will never add up to knowing <span className="mn-italic-plum">one person.</span>
            </p>
          </div>

          {/* 7. Ivory sticky — belief 04 */}
          <div
            className="mn-item mn-item--sticky"
            style={{ top: 600, left: 100, width: 300, transform: 'rotate(3deg)' }}
          >
            <Pin />
            <p className="mn-label mn-label--plum">take 04.</p>
            <p className="mn-belief mn-belief--ink mn-belief--italic">
              fashion should work for your life, not the other way around.
            </p>
          </div>

          {/* 8. Dark ink card — belief 06 (gold top accent, gold italic) */}
          <div
            className="mn-item mn-item--ink"
            style={{ top: 580, right: 24, width: 380, transform: 'rotate(-2.4deg)' }}
          >
            <Pin />
            <p className="mn-label mn-label--gold">take 06.</p>
            <p className="mn-belief mn-belief--cream">
              there’s a confidence that comes from knowing you look right for the room. <span className="mn-italic-gold">everyone</span> deserves that.
            </p>
          </div>

        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
