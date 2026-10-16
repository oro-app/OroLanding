import { useEffect, useRef } from 'react'
import placeholderOutfit from '../../assets/fit-gen-demo/mens-cargos.webp'
import './OutfitGallery.css'

const OUTFITS = [
  { caption: 'coffee, then whatever', tilt: '-5deg', lift: '12px' },
  { caption: 'a little overdressed', tilt: '4deg', lift: '-18px' },
  { caption: 'your usual, remixed', tilt: '-3deg', lift: '22px' },
  { caption: 'out past midnight', tilt: '5deg', lift: '-12px' },
  { caption: 'nothing on the calendar', tilt: '-4deg', lift: '16px' },
  { caption: 'something very you', tilt: '3deg', lift: '-16px' },
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
    const pin = matchMedia('(min-width: 1024px) and (min-height: 850px) and (hover: hover) and (prefers-reduced-motion: no-preference)')
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
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const measure = () => {
      distance = Math.max(0, scroller.scrollWidth - scroller.clientWidth)
      travel = Math.max(1, distance * 1.25)
      section.classList.toggle('outfit-gallery--pinned', pin.matches)
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
        <div className="outfit-gallery-heading halo-container">
          <p className="outfit-gallery-eyebrow">a different you, every day</p>
          <h2 id="outfit-gallery-title">your clothes.<br /><em>so many possibilities.</em></h2>
        </div>
        <div className="outfit-gallery-scroller" ref={scrollerRef} tabIndex={0} role="region" aria-label="Outfit Polaroids" aria-describedby="outfit-gallery-hint" onKeyDown={onKeyDown}>
          <ul className="outfit-gallery-track" ref={trackRef}>
            {OUTFITS.map((outfit, index) => (
              <li className="outfit-gallery-item" key={outfit.caption} style={{ '--card-tilt': outfit.tilt, '--card-lift': outfit.lift, '--card-delay': `${index * -1.4}s` }}>
                <figure className="outfit-gallery-polaroid">
                  <img src={placeholderOutfit} alt="Streetwear outfit with a leather jacket, graphic tee, olive cargos, and sneakers." width="1086" height="1448" loading="lazy" decoding="async" />
                  <figcaption>{outfit.caption}</figcaption>
                </figure>
              </li>
            ))}
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
