import { useEffect, useRef } from 'react'
import galleryDate from '../../assets/outfit-gallery/gallery-date.webp'
import sportyWeekend from '../../assets/outfit-gallery/sporty-weekend.webp'
import tailoredWorkday from '../../assets/outfit-gallery/tailored-workday.webp'
import softDate from '../../assets/outfit-gallery/soft-date.webp'
import smartCasual from '../../assets/outfit-gallery/smart-casual.webp'
import './OutfitGallery.css'

const OUTFITS = [
  { image: galleryDate, alt: 'White fitted tee, black hoodie, relaxed charcoal jeans, brown sneakers, and gold accessories.', caption: 'coffee, then whatever', tilt: '-5deg', lift: '12px' },
  { image: tailoredWorkday, alt: 'Navy blazer, pale blue shirt, charcoal tailored trousers, brown loafers, and a leather work bag.', caption: 'big meeting energy', tilt: '4deg', lift: '-18px' },
  { image: softDate, alt: 'Pink cardigan, ivory lace camisole and skirt, burgundy Mary Janes, and delicate pearl and gold accessories.', caption: 'bookstore date', tilt: '-3deg', lift: '22px' },
  { image: sportyWeekend, alt: 'Cream and navy football jersey, washed black denim shorts, sneakers, headphones, and a sling bag.', caption: 'nothing on the calendar', tilt: '5deg', lift: '-12px' },
  { image: smartCasual, alt: 'Charcoal cropped jacket, white tee, loose black tailored trousers, loafers, and silver accessories.', caption: 'work, then dinner', tilt: '-4deg', lift: '16px' },
]

export default function OutfitGallery() {
  const sectionRef = useRef(null)
  const scrollerRef = useRef(null)
  const trackRef = useRef(null)
  const navigateRef = useRef(null)

  useEffect(() => {
    const section = sectionRef.current
    const scroller = scrollerRef.current
    const track = trackRef.current
    const pin = matchMedia('(prefers-reduced-motion: no-preference)')
    let frame = 0
    let distance = 0
    let travel = 0
    let sectionTop = 0

    const update = () => {
      frame = 0
      if (!pin.matches) return
      sectionTop = section.getBoundingClientRect().top + scrollY
      const progress = Math.min(1, Math.max(0, (scrollY - sectionTop) / travel))
      scroller.scrollLeft = progress * distance
      const finaleStart = track.lastElementChild.offsetLeft - scroller.clientWidth * .8
      const finaleEnd = distance - scroller.clientWidth * .08
      const reveal = Math.min(1, Math.max(0, (scroller.scrollLeft - finaleStart) / Math.max(1, finaleEnd - finaleStart)))
      section.style.setProperty('--finale-reveal', reveal)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const measure = () => {
      section.classList.toggle('outfit-gallery--pinned', pin.matches)
      distance = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      travel = Math.max(1, distance)
      section.style.setProperty('--gallery-travel', `${travel}px`)
      sectionTop = section.getBoundingClientRect().top + scrollY
      schedule()
    }
    navigateRef.current = (direction) => {
      if (!distance) return
      const step = track.firstElementChild.offsetWidth + parseFloat(getComputedStyle(track).columnGap)
      const target = Math.min(distance, Math.max(0, scroller.scrollLeft + direction * step))
      if (pin.matches) {
        sectionTop = section.getBoundingClientRect().top + scrollY
        window.scrollTo({ top: sectionTop + target / distance * travel, behavior: 'smooth' })
      } else {
        scroller.scrollTo({ left: target, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      }
    }
    const resize = new ResizeObserver(measure)
    resize.observe(scroller)
    resize.observe(track)
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', measure)
    pin.addEventListener('change', measure)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', measure)
      pin.removeEventListener('change', measure)
      navigateRef.current = null
    }
  }, [])

  const onKeyDown = (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    navigateRef.current?.(event.key === 'ArrowRight' ? 1 : -1)
  }

  return (
    <section className="outfit-gallery" ref={sectionRef} aria-labelledby="outfit-gallery-title" data-analytics-section="outfit_gallery">
      <div className="outfit-gallery-stage">
        <div className="outfit-gallery-scroller" ref={scrollerRef} tabIndex={0} role="region" aria-label="Outfit Polaroids" aria-describedby="outfit-gallery-hint" onKeyDown={onKeyDown}>
          <ul className="outfit-gallery-track" ref={trackRef}>
            {OUTFITS.map((outfit, index) => (
              <li className="outfit-gallery-item" key={outfit.caption} style={{ '--card-tilt': outfit.tilt, '--card-lift': outfit.lift, '--card-delay': `${index * -1.4}s` }}>
                <figure className="outfit-gallery-polaroid">
                  <img src={outfit.image} alt={outfit.alt} width="1086" height="1448" loading="lazy" decoding="async" />
                  <figcaption>{outfit.caption}</figcaption>
                </figure>
              </li>
            ))}
            <li className="outfit-gallery-finale">
              <div className="outfit-gallery-finale-copy">
                <h2 id="outfit-gallery-title">your clothes.<br /><em>so many possibilities.</em></h2>
              </div>
            </li>
          </ul>
        </div>
        <div className="outfit-gallery-bottom halo-container">
          <p id="outfit-gallery-hint"><span className="outfit-gallery-hint-scroll">keep scrolling</span><span className="outfit-gallery-hint-swipe">swipe through</span><span aria-hidden="true"> ↗</span></p>
          <div className="outfit-gallery-controls" aria-label="Browse outfits">
            <button type="button" aria-label="Previous outfits" onClick={() => navigateRef.current?.(-1)}><span aria-hidden="true">←</span></button>
            <button type="button" aria-label="Next outfits" onClick={() => navigateRef.current?.(1)}><span aria-hidden="true">→</span></button>
          </div>
        </div>
      </div>
    </section>
  )
}
