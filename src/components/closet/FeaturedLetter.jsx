import { Heading, Text } from 'oro-kit'
import './FeaturedLetter.css'

// Preserve the emphasis selected by the article's italicTitle frontmatter.

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
          <span className="fl-prerule-label">This week.</span>
          <span className="fl-prerule-line" aria-hidden="true" />
          <span className="fl-prerule-meta">
            {letter.dateLabel}
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
            <img
              className="fl-photo"
              src={letter.image}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="fl-text">
            <Heading variant="title" className="fl-title">
              <TitleWithItalic title={letter.title} italic={letter.italicTitle} />
            </Heading>
            {letter.summary && <Text muted className="fl-excerpt">{letter.summary}</Text>}
            <span className="fl-readlink">
              Read the letter
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
