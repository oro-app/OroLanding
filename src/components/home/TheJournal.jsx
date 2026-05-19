import { useState } from 'react'
import { newsletters } from '../../lib/newsletters'

// The journal — replaces the old NewsletterSection; wired to the real
// src/lib/newsletters.js glob (most recent 3 MDX issues). Renders the dark
// variant in both themes (colour-themed via --color-*).
//
// Reframed from the prototype's flat 3-up grid to an intentional "the
// latest" editorial moment: big headline + quiet supporting line, then a
// featured layout — one large lead entry + two smaller. The dead
// "all entries → /journal" link was removed (the archive page is out of
// scope; the link was the main thing that made the section feel broken).
// TheJournalLight is kept for reference / easy revert (unused).

const ENTRIES = newsletters.slice(0, 3)

function Arrow({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function TheJournalLight({ onSubscribe }) {
  const [email, setEmail] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubscribe?.(email)
  }

  return (
    <section id="journal" className="jr jr--light">
      <div className="jr-l-head">
        <h2 className="jr-l-title">
          the <span className="jr-accent">journal</span>.
        </h2>
        <a className="jr-l-all" href="/journal">
          all entries
          <Arrow size={10} />
        </a>
      </div>

      <div className="jr-l-grid">
        {ENTRIES.map((e) => (
          <a className="jr-l-card" href={e.href} key={e.slug}>
            <div className="jr-l-photo" style={{ backgroundImage: `url(${e.image})` }} />
            <div className="jr-l-date">{e.dateLabel.toUpperCase()}</div>
            <h3 className="jr-l-cardtitle">{e.title}</h3>
            <p className="jr-l-excerpt">{e.summary}</p>
          </a>
        ))}
      </div>

      <div className="jr-l-signup">
        <div>
          <h3 className="jr-l-signup-title">
            one letter. <span className="jr-accent">once a month</span>.
          </h3>
          <p className="jr-l-signup-sub">a slow read on style and mornings. no growth hacks.</p>
        </div>
        <form className="jr-l-form" onSubmit={handleSubmit}>
          <div className="jr-l-field">
            <input
              type="email"
              className="jr-l-input"
              placeholder="your email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
            <button type="submit" className="jr-l-subscribe">
              subscribe
              <Arrow size={10} />
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

function TheJournalDark() {
  const [lead, ...rest] = ENTRIES

  return (
    <section id="journal" className="jr jr--dark">
      <div className="jr-head">
        <h2 className="jr-title">
          the <span className="jr-em">journal</span>.
        </h2>
        <p className="jr-sub">a slow read on style and mornings. the latest, below.</p>
      </div>

      <div className="jr-feature">
        {lead && (
          <a className="jr-lead" href={lead.href}>
            <div className="jr-lead-photo" style={{ backgroundImage: `url(${lead.image})` }} />
            <div className="jr-lead-meta">
              <div className="jr-date">{lead.dateLabel.toLowerCase()}</div>
              <h3 className="jr-lead-title">{lead.title}</h3>
              {lead.summary && <p className="jr-lead-sum">{lead.summary}</p>}
            </div>
          </a>
        )}

        <div className="jr-rest">
          {rest.map((e) => (
            <a className="jr-mini" href={e.href} key={e.slug}>
              <div className="jr-mini-photo" style={{ backgroundImage: `url(${e.image})` }} />
              <div className="jr-mini-meta">
                <div className="jr-date">{e.dateLabel.toLowerCase()}</div>
                <h3 className="jr-mini-title">{e.title}</h3>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function TheJournal() {
  // Light === dark on the home page: always render the dark variant.
  // (The dark journal has no signup form, so onSubscribe is unused here.)
  return <TheJournalDark />
}
