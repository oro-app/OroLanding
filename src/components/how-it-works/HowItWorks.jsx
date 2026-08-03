import SiteFooter from '../layout/SiteFooter'
import HorizontalSteps from './HorizontalSteps'
import ProductFaq from '../marketing/ProductFaq'
import { trackCtaClick } from '../../lib/analytics'
import wardrobeImg from '../../assets/how-it-works/wardrobe.webp'
import stylemeImg  from '../../assets/how-it-works/styleme.webp'
import resultImg   from '../../assets/how-it-works/result.webp'
import tryonImg    from '../../assets/how-it-works/tryon.webp'
import './HowItWorks.css'

const STEPS = [
  { n: 'one',   title: 'add your closet.',  img: wardrobeImg, body: 'snap some fit pics. oro tags every piece in seconds — fabric, colour, formality, season. the more you add, the better it knows you.' },
  { n: 'two',   title: 'tell oro where you’re going.',  img: stylemeImg,  body: 'a casual day, a work meeting, a night out — oro treats each one differently because they are different.' },
  { n: 'three', title: 'see it on you.',    img: resultImg,   body: 'virtual try-on shows the outfit on your body before you commit. not feeling it? oro will try again.' },
  { n: 'four',  title: 'and you’re out.', img: tryonImg, body: 'one outfit, built from clothes you already own. love it? tap to log. don’t? ask for another. either way — out the door in thirty seconds.' },
]

export default function HowItWorks() {
  const handleTryOro = () => {
    trackCtaClick('cta_click', { location: 'how-it-works', destination: 'try_oro' })
  }

  return (
    <main className="hiw">
      <section className="hiw-hero">
        <div className="hiw-hero-inner">
          <h1 className="hiw-title">
            the right outfit,<br />
            <span className="hiw-em">every time</span>.
          </h1>
          <p className="hiw-sub">
            a minute a morning. picked from clothes you already own — and tried on before you commit.
          </p>
        </div>
      </section>

      <HorizontalSteps steps={STEPS} />

      <section className="hiw-cta">
        {/* Consumes the @oro/web --statement/--inverse recipe by class name, not
            <Cta>: this is a real crawlable <a href> and Cta renders a hard-coded
            <button> with no as/href escape hatch. Raised upstream (polymorphic Cta). */}
        <a className="oro-cta oro-cta--statement oro-cta--inverse hiw-cta-btn" href="/try-oro" onClick={handleTryOro}>
          try oro
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </section>

      <ProductFaq />

      <SiteFooter />
    </main>
  )
}
