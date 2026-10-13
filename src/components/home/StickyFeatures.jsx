import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { hasAnalyticsConsent, trackEvent } from '../../lib/analytics'
import './StickyFeatures.css'

export default function StickyFeatures({ features }) {
  const sectionRef = useRef(null)
  const viewedRef = useRef(new Set())
  const [active, setActive] = useState(0)

  useEffect(() => {
    const section = sectionRef.current
    let frame
    const update = () => {
      const panel = section.firstElementChild
      const distance = section.offsetHeight - panel.offsetHeight
      const top = parseFloat(getComputedStyle(panel).top) || 0
      const progress = distance > 0 ? (top - section.getBoundingClientRect().top) / distance : 0
      setActive(Math.min(features.length - 1, Math.max(0, Math.floor(progress * features.length))))
      frame = undefined
    }
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(section)
    observer.observe(section.firstElementChild)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    schedule()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [features.length])

  useEffect(() => {
    const articles = sectionRef.current.querySelectorAll('article')
    const track = () => {
      if (!hasAnalyticsConsent()) return
      const stacked = window.matchMedia('(prefers-reduced-motion: reduce), (max-height: 600px)').matches
      articles.forEach((article, index) => {
        const bounds = article.getBoundingClientRect()
        if ((!stacked && index !== active) || viewedRef.current.has(index) || bounds.bottom <= 0 || bounds.top >= window.innerHeight) return
        viewedRef.current.add(index)
        trackEvent('section_view', { section_name: ['closet', 'outfit_iteration_demo', 'learns_preferences'][index] })
      })
    }
    const observer = new IntersectionObserver(track, { threshold: 0.12 })
    articles.forEach((article) => observer.observe(article))
    track()
    window.addEventListener('oro:analytics-consent-change', track)
    return () => {
      observer.disconnect()
      window.removeEventListener('oro:analytics-consent-change', track)
    }
  }, [active])

  return (
    <section className="home-features home-features--sticky" aria-label="oro features" ref={sectionRef}>
      <div className="home-features-pin">
        <div className="home-features-stage">
          {features.map((feature, index) => (
            <article className="home-feature home-feature--slide" key={feature.title}
              style={{ '--feature-offset': index - active, '--feature-opacity': index === active ? 1 : 0 }}>
              <div className="home-feature-copy">
                <Heading as="h2" variant="title">{feature.title}</Heading>
                <Text muted className="home-description">{feature.description}</Text>
              </div>
              <img className="home-feature-media" src={feature.image} alt={feature.imageAlt}
                loading="lazy" decoding="async" width={feature.width} height={feature.height} />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
