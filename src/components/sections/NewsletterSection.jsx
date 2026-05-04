import { useEffect, useRef, useState } from 'react'
import { newsletters } from '../../lib/newsletters'
import './NewsletterSection.css'

export default function NewsletterSection() {
  const trackRef = useRef(null)
  const [activePage, setActivePage] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [isMobileCarousel, setIsMobileCarousel] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)')
    const updateMode = () => setIsMobileCarousel(query.matches)

    updateMode()
    query.addEventListener('change', updateMode)

    return () => query.removeEventListener('change', updateMode)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return undefined

    const updateCarouselPages = () => {
      if (isMobileCarousel) {
        const cards = Array.from(track.querySelectorAll('.newsletter-card'))
        const trackCenter = track.getBoundingClientRect().left + (track.clientWidth / 2)
        const closestIndex = cards.reduce((bestIndex, card, index) => {
          const bestCard = cards[bestIndex]
          const cardCenter = card.getBoundingClientRect().left + (card.clientWidth / 2)
          const bestCenter = bestCard.getBoundingClientRect().left + (bestCard.clientWidth / 2)
          return Math.abs(cardCenter - trackCenter) < Math.abs(bestCenter - trackCenter)
            ? index
            : bestIndex
        }, 0)

        setPageCount(newsletters.length)
        setActivePage(closestIndex)
        return
      }

      const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0)
      const nextPageCount = maxScroll === 0
        ? 1
        : Math.ceil(track.scrollWidth / track.clientWidth)
      const pageSize = nextPageCount > 1 ? maxScroll / (nextPageCount - 1) : 0
      const nextActivePage = pageSize > 0 ? Math.round(track.scrollLeft / pageSize) : 0

      setPageCount(nextPageCount)
      setActivePage(Math.min(nextActivePage, nextPageCount - 1))
    }

    updateCarouselPages()
    track.addEventListener('scroll', updateCarouselPages, { passive: true })
    window.addEventListener('resize', updateCarouselPages)

    return () => {
      track.removeEventListener('scroll', updateCarouselPages)
      window.removeEventListener('resize', updateCarouselPages)
    }
  }, [isMobileCarousel])

  if (newsletters.length === 0) return null

  const scrollToPage = (index) => {
    const track = trackRef.current
    if (!track) return

    if (isMobileCarousel) {
      const card = track.querySelectorAll('.newsletter-card')[index]
      if (!card) return

      track.scrollTo({
        left: card.offsetLeft - ((track.clientWidth - card.clientWidth) / 2),
        behavior: 'smooth',
      })
      return
    }

    const maxScroll = Math.max(track.scrollWidth - track.clientWidth, 0)
    const pageSize = pageCount > 1 ? maxScroll / (pageCount - 1) : 0

    track.scrollTo({
      left: pageSize * index,
      behavior: 'smooth',
    })
  }

  const goPrevious = () => scrollToPage(activePage === 0 ? pageCount - 1 : activePage - 1)
  const goNext = () => scrollToPage(activePage === pageCount - 1 ? 0 : activePage + 1)
  const controls = (
    <>
      <button
        type="button"
        className="newsletter-icon-button"
        onClick={goPrevious}
        disabled={pageCount <= 1}
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
        disabled={pageCount <= 1}
        aria-label="Next newsletter"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </>
  )

  return (
    <section className="newsletter-section" id="newsletter">
      <div className="newsletter-shell">
        <div className="newsletter-header">
          <div>
            <h2 className="newsletter-title">Small notes on getting dressed well</h2>
          </div>

          {pageCount > 1 && (
            <div className="newsletter-controls newsletter-controls-desktop" aria-label="Newsletter carousel controls">
              {controls}
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

        {pageCount > 1 && (
          <div className="newsletter-controls newsletter-controls-mobile" aria-label="Newsletter carousel controls">
            {controls}
          </div>
        )}

        {pageCount > 1 && (
          <div className="newsletter-dots" aria-hidden="true">
            {Array.from({ length: pageCount }, (_, index) => (
              <span
                className={`newsletter-dot${index === activePage ? ' is-active' : ''}`}
                key={index}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
