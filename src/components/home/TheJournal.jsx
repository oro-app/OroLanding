import { useState } from 'react'
import { newsletters } from '../../lib/newsletters'

// The journal — faithful to the handoff (sections/the-journal.jsx +
// sections/dark/the-journal.jsx), replacing the old NewsletterSection.
// Wired to the real src/lib/newsletters.js glob (most recent 3 MDX issues).
//
// Light: header + 3 cards (16/10 image, UPPERCASE date, title, italic
//   excerpt) + an inline newsletter signup box.
// Dark: big header + 3 cards (4/5 image, lowercase date, title) — no
//   excerpt, no signup form (per the prototype).
//
// Deviations from the prototype, flagged for review:
// - Card links go to the real /newsletter/:slug (prototype used #journal-i).
// - "all entries" → /journal, which has no page yet (out of scope per the
//   handoff; lands on the home view for now).
// - The light signup form is wired to the existing WaitlistModal (proper
//   consent flow) instead of the prototype's fake inline-success state.
// - Real article titles render as authored (not force-lowercased).

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
  return (
    <section id="journal" className="jr jr--dark">
      <div className="jr-d-head">
        <h2 className="jr-d-title">
          the <span className="jr-em">journal</span>.
        </h2>
        <a className="jr-d-all" href="/journal">all entries →</a>
      </div>

      <div className="jr-d-grid">
        {ENTRIES.map((e) => (
          <a className="jr-d-card" href={e.href} key={e.slug}>
            <div className="jr-d-photo" style={{ backgroundImage: `url(${e.image})` }} />
            <div className="jr-d-date">{e.dateLabel.toLowerCase()}</div>
            <h3 className="jr-d-cardtitle">{e.title}</h3>
          </a>
        ))}
      </div>
    </section>
  )
}

export default function TheJournal() {
  // Light === dark on the home page: always render the dark variant.
  // (The dark journal has no signup form, so onSubscribe is unused here.)
  return <TheJournalDark />
}
