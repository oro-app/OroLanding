import { useEffect } from 'react'
import { newsletters } from '../../lib/newsletters'
import SiteFooter from '../layout/SiteFooter'
import './JournalPage.css'

// The journal archive — a chronological list of every published newsletter.
// Same editorial dark aesthetic as the home-page section (TheJournalDark):
// big italic-accent serif headline, vertical list of issue rows, hairline
// dividers, plum/cream tokens. Each row links to /newsletter/:slug and opens
// in a new tab (matches the rest of the site's link policy).
export default function JournalPage() {
  useEffect(() => {
    const prev = document.title
    document.title = 'the journal — oro'
    return () => { document.title = prev }
  }, [])

  return (
    <main className="journal-archive">
      <section className="ja-hero">
        <div className="ja-hero-inner">
          <h1 className="ja-title">
            the <span className="ja-em">journal</span>.
          </h1>
          <p className="ja-sub">
            a slow read on style and mornings. every issue, in order.
          </p>
        </div>
      </section>

      <section className="ja-list-wrap" aria-label="all issues">
        <ol className="ja-list">
          {newsletters.map((n) => (
            <li className="ja-row" key={n.slug}>
              <a
                className="ja-row-link"
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="ja-row-meta">
                  <span className="ja-row-tag">{n.tag}</span>
                  {n.dateLabel && (
                    <>
                      <span className="ja-row-dot" aria-hidden="true">·</span>
                      <time className="ja-row-date" dateTime={n.date}>{n.dateLabel}</time>
                    </>
                  )}
                </div>
                <h2 className="ja-row-title">{n.title}</h2>
                {n.summary && <p className="ja-row-sum">{n.summary}</p>}
              </a>
            </li>
          ))}
        </ol>
      </section>

      <SiteFooter />
    </main>
  )
}
