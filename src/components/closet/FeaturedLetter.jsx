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

export default function FeaturedLetter({ letter }) {
  if (!letter) return null

  return (
    <section className="fl">
      <div className="fl-inner">
        {/* Labelled hairline pre-rule */}
        <div className="fl-prerule">
          <span className="fl-prerule-label">this week.</span>
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

        <a className="fl-card" href={letter.href} rel="noopener noreferrer">
          <div className="fl-photo-wrap">
            <div className="fl-photo" style={{ backgroundImage: `url(${letter.image})` }} aria-hidden="true" />
          </div>
          <div className="fl-text">
            <h2 className="fl-title">
              <TitleWithItalic title={letter.title} italic={letter.italicTitle} />
            </h2>
            {letter.summary && <p className="fl-excerpt">{letter.summary}</p>}
            <span className="fl-readlink">
              read the letter
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </a>
      </div>
    </section>
  )
}
