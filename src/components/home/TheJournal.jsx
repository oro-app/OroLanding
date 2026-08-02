import { Cta } from '@oro/web'
import { trackCtaClick } from '../../lib/analytics'
import { readableNewsletters } from '../../lib/newsletters'

const ALL_COUNT = readableNewsletters.length

// The journal — replaces the old NewsletterSection; wired to the real
// src/lib/newsletters.js glob (most recent 3 MDX issues). Renders the dark
// variant in both themes (colour-themed via --color-*).
//
// Reframed from the prototype's flat 3-up grid to an intentional "the
// latest" editorial moment: big headline + quiet supporting line, then a
// featured layout — one large lead entry + two smaller. The dead
// "all entries → /journal" link was removed (the archive page is out of
// scope; the link was the main thing that made the section feel broken).

const ENTRIES = readableNewsletters.slice(0, 3)

function Arrow({ size = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function TheJournalDark({ onSubscribe }) {
  const [lead, ...rest] = ENTRIES

  const handleSubscribe = () => {
    trackCtaClick('join_mailing_list_click', { location: 'home_journal' })
    onSubscribe?.()
  }

  return (
    <section id="journal" className="jr jr--dark">
      <div className="jr-head">
        <h2 className="jr-title">
          from the <span className="jr-em">closet</span>.
        </h2>
        <p className="jr-sub">oro’s newsletter on style and getting dressed. twice a week.</p>
      </div>

      <div className="jr-feature">
        {lead && (
          <a className="jr-lead" href={lead.href} rel="noopener noreferrer">
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
            <a className="jr-mini" href={e.href} key={e.slug} rel="noopener noreferrer">
              <div className="jr-mini-photo" style={{ backgroundImage: `url(${e.image})` }} />
              <div className="jr-mini-meta">
                <div className="jr-date">{e.dateLabel.toLowerCase()}</div>
                <h3 className="jr-mini-title">{e.title}</h3>
              </div>
            </a>
          ))}

          <a className="jr-all" href="/from-the-closet" rel="noopener noreferrer">
            see all {ALL_COUNT} issues
            <Arrow size={14} />
          </a>

          <Cta size="standard" inverse className="jr-subscribe" onClick={handleSubscribe}>
            join the mailing list
            <Arrow size={12} />
          </Cta>
        </div>
      </div>
    </section>
  )
}

export default function TheJournal({ onSubscribe }) {
  // Light === dark on the home page: always render the dark variant.
  return <TheJournalDark onSubscribe={onSubscribe} />
}
