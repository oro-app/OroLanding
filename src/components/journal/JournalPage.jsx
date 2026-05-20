import { useEffect, useRef, useState } from 'react'
import { newsletters } from '../../lib/newsletters'
import SiteFooter from '../layout/SiteFooter'
import './JournalPage.css'

// The journal archive — a chronological list of every published newsletter.
// Same editorial dark aesthetic as the home-page section (TheJournalDark):
// big italic-accent serif headline, vertical list of issue rows, hairline
// dividers, plum/cream tokens. Each row links to /newsletter/:slug and opens
// in a new tab (matches the rest of the site's link policy).
//
// Reveal animations: hero enters on mount (title, sub), each issue row
// cascades in as the list scrolls into view (hairline draws, meta fades,
// title rises with a brief gold 'highlight of oro' pass, summary fades).
// Same gesture as /why-oro + /try-oro so all the editorial subpages settle
// in identically.

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

export default function JournalPage() {
  const [listRef, listRevealed] = useRevealOnScroll(0.05)

  useEffect(() => {
    const prev = document.title
    document.title = 'from the closet — oro'
    return () => { document.title = prev }
  }, [])

  return (
    <main className="journal-archive">
      <section className="ja-hero">
        <div className="ja-hero-inner">
          <h1 className="ja-title">
            from the <span className="ja-em">closet</span>.
          </h1>
          <p className="ja-sub">
            oro’s newsletter on style and getting dressed. twice a week.
          </p>
        </div>
      </section>

      <section
        className="ja-list-wrap"
        aria-label="all issues"
        ref={listRef}
        data-revealed={listRevealed ? 'true' : 'false'}
      >
        <ol className="ja-list">
          {newsletters.map((n, i) => (
            <li className="ja-row" key={n.slug} style={{ '--reveal-i': i }}>
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
