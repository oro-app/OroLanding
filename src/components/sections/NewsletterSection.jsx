import { useEffect, useRef, useState } from 'react'
import { newsletters } from '../../lib/newsletters'
import './NewsletterSection.css'

export default function NewsletterSection() {
  const trackRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const updateActiveCard = () => {
      const cards = Array.from(track.querySelectorAll('.newsletter-card'))
      const trackLeft = track.getBoundingClientRect().left
      const closestIndex = cards.reduce((bestIndex, card, index) => {
        const bestCard = cards[bestIndex]
        const currentDistance = Math.abs(card.getBoundingClientRect().left - trackLeft)
        const bestDistance = Math.abs(bestCard.getBoundingClientRect().left - trackLeft)
        return currentDistance < bestDistance ? index : bestIndex
      }, 0)

      setActiveIndex(closestIndex)
    }

    updateActiveCard()
    track.addEventListener('scroll', updateActiveCard, { passive: true })
    window.addEventListener('resize', updateActiveCard)

    return () => {
      track.removeEventListener('scroll', updateActiveCard)
      window.removeEventListener('resize', updateActiveCard)
    }
  }, [])

  if (newsletters.length === 0) return null

  const scrollToCard = (index) => {
    const track = trackRef.current
    const card = track?.querySelectorAll('.newsletter-card')[index]
    if (!track || !card) return

    track.scrollTo({
      left: card.offsetLeft - track.offsetLeft,
      behavior: 'smooth',
    })
  }

  const goPrevious = () => scrollToCard(Math.max(activeIndex - 1, 0))
  const goNext = () => scrollToCard(Math.min(activeIndex + 1, newsletters.length - 1))

  return (
    <section className="newsletter-section" id="newsletter">
      <div className="newsletter-shell">
        <div className="newsletter-header">
          <div>
            <p className="newsletter-eyebrow">Newsletter</p>
            <h2 className="newsletter-title">Notes from the wardrobe</h2>
          </div>

          {newsletters.length > 1 && (
            <div className="newsletter-controls" aria-label="Newsletter carousel controls">
              <button
                type="button"
                className="newsletter-icon-button"
                onClick={goPrevious}
                disabled={activeIndex === 0}
                aria-label="Previous newsletter"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                type="button"
                className="newsletter-icon-button"
                onClick={goNext}
                disabled={activeIndex === newsletters.length - 1}
                aria-label="Next newsletter"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="newsletter-track" ref={trackRef}>
          {newsletters.map((newsletter) => (
            <a className="newsletter-card" href={newsletter.href} key={newsletter.slug}>
              <div className="newsletter-card-image-wrap">
                <img className="newsletter-card-image" src={newsletter.image} alt="" loading="lazy" />
              </div>
              <div className="newsletter-card-body">
                <time className="newsletter-card-date" dateTime={newsletter.date}>
                  {newsletter.dateLabel}
                </time>
                <h3>{newsletter.title}</h3>
                <p>{newsletter.summary}</p>
              </div>
            </a>
          ))}
        </div>

        {newsletters.length > 1 && (
          <div className="newsletter-dots" aria-hidden="true">
            {newsletters.map((newsletter, index) => (
              <span
                className={`newsletter-dot${index === activeIndex ? ' is-active' : ''}`}
                key={newsletter.slug}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
