import { useEffect, useRef } from 'react'

export default function DesignerFeatures({ features }) {
  const ref = useRef(null)
  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      frame = 0
      const middle = innerHeight / 2
      ref.current.querySelectorAll('.oro-grid-row').forEach((row) => {
        const bounds = row.getBoundingClientRect()
        row.classList.toggle('is-faded', !motion.matches && !(bounds.top < middle - innerHeight * .12 && bounds.bottom > middle + innerHeight * .12))
        if (bounds.top < innerHeight * .85 || motion.matches) row.classList.add('is-in')
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    motion.addEventListener('change', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', schedule)
    }
  }, [])
  return <section className="oro-grid" aria-label="what oro does" ref={ref}>
    <ul className="oro-grid-list">{features.map((feature, index) => <li key={feature.title}
      className={`oro-grid-row oro-closet-row oro-grid-row--${index === 1 ? 'left' : 'right'}`}
      data-analytics-section={['closet', 'outfit_iteration_demo', 'learns_preferences'][index]}>
      <div className="oro-grid-cell"><div className={`oro-grid-copy oro-closet${index === 1 ? ' oro-tellher' : index === 2 ? ' oro-texther' : ''}`}>
        <div className="oro-closet-text"><h2 className="oro-grid-title">{index === 2 ? <>the more you text her,<br />the better she gets</> : feature.title}</h2><p className="oro-grid-sub">{feature.description}</p></div>
        <figure className="oro-closet-media"><img src={feature.image} alt={feature.imageAlt} width={feature.width} height={feature.height} loading="lazy" decoding="async" /></figure>
      </div></div>
    </li>)}</ul>
  </section>
}

export function DesignerRibbon() {
  return <section className="oro-marquee" aria-label="she gets your style. and your life." data-analytics-section="personalized_style">
    <div className="oro-marquee-band" aria-hidden="true"><div className="oro-marquee-track">{Array.from({ length: 8 }, (_, index) => <span className="oro-marquee-item" key={index}>she gets your style. and your life.<svg viewBox="0 0 24 24"><path d="M12 0c.8 6.4 5.6 11.2 12 12-6.4.8-11.2 5.6-12 12-.8-6.4-5.6-11.2-12-12C6.4 11.2 11.2 6.4 12 0Z" /></svg></span>)}</div></div>
  </section>
}
