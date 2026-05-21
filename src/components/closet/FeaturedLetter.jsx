import './FeaturedLetter.css'

// "This week" featured letter — labelled hairline pre-rule + asymmetric
// 2-column card (photo left, title/excerpt/read-link right). Title supports
// italic-on-the-key-word via the newsletter's `italicTitle` frontmatter
// field; if set and present in the title, that substring renders inside <em>.

function TitleWithItalic({ title, italic }) {
  if (!italic) return <>{title}</>
  const i = title.indexOf(italic)
  if (i === -1) return <>{title}</>
  return (
    <>
      {title.slice(0, i)}
      <em className="fl-em">{italic}</em>
      {title.slice(i + italic.length)}
    </>
  )
}

// "May 23, 2026" -> "may 23" (drops the year + lowercases) for the
// coming-soon "lands ___" line.
function shortDate(label) {
  return label.replace(/,\s*\d{4}$/, '').toLowerCase()
}

export default function FeaturedLetter({ letter }) {
  if (!letter) return null
  const soon = letter.comingSoon

  const inner = (
    <>
      <div className="fl-photo-wrap">
        <div className="fl-photo" style={{ backgroundImage: `url(${letter.image})` }} aria-hidden="true" />
      </div>
      <div className="fl-text">
        <h2 className="fl-title">
          <TitleWithItalic title={letter.title} italic={letter.italicTitle} />
        </h2>
        {letter.summary && <p className="fl-excerpt">{letter.summary}</p>}
        {soon ? (
          <span className="fl-soonline">lands {shortDate(letter.dateLabel)}.</span>
        ) : (
          <span className="fl-readlink">
            read the letter
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>
    </>
  )

  return (
    <section className="fl">
      <div className="fl-inner">
        {/* Labelled hairline pre-rule */}
        <div className="fl-prerule">
          <span className="fl-prerule-label">{soon ? 'coming soon.' : 'this week.'}</span>
          <span className="fl-prerule-line" aria-hidden="true" />
          <span className="fl-prerule-meta">
            {letter.dateLabel.toLowerCase()}
            {letter.readTime && (
              <>
                <span className="fl-prerule-dot" aria-hidden="true">·</span>
                <span>{letter.readTime}</span>
              </>
            )}
          </span>
        </div>

        {soon ? (
          // Not published yet — render the card as a non-clickable block with
          // a "coming soon" badge over the photo.
          <div className="fl-card fl-card--soon">
            <span className="fl-badge">coming soon</span>
            {inner}
          </div>
        ) : (
          <a className="fl-card" href={letter.href} target="_blank" rel="noopener noreferrer">
            {inner}
          </a>
        )}
      </div>
    </section>
  )
}
