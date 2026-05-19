import { trackEvent } from '../../lib/analytics'

// Oro insiders — a SHARED section (single component; theme-aware colour, same
// layout in both themes). Faithful to the handoff's sections/oro-insiders.jsx.
// "apply for access" opens the existing WaitlistModal (the early-access list).

const PERKS = [
  { title: 'founders’ pricing, locked.', desc: 'whatever oro costs at launch — you pay our first price, forever.' },
  { title: 'shape what we build.',        desc: 'monthly calls with the team. your asks, our roadmap.' },
  { title: 'first in line.',              desc: 'every feature, every fit beta — you see it first.' },
]

export default function OroInsiders({ onApply }) {
  const handleApply = () => {
    trackEvent('cta_click', { location: 'insiders', destination: 'waitlist' })
    onApply?.()
  }

  return (
    <section id="insiders" className="ins">
      <div className="ins-inner">
        <div className="ins-head">
          <h2 className="ins-title">
            be an <span className="ins-em">insider</span>.
          </h2>
          <p className="ins-lead">
            we’re building oro with a small group of early users.
            they pick the next feature. they get founders’ pricing.
          </p>
        </div>

        <div className="ins-perks">
          {PERKS.map((p) => (
            <div className="ins-perk" key={p.title}>
              <h3 className="ins-perk-title">{p.title}</h3>
              <p className="ins-perk-desc">{p.desc}</p>
            </div>
          ))}
        </div>

        <button type="button" className="ins-cta" onClick={handleApply}>
          apply for access
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  )
}
