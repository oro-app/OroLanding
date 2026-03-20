import { useRef } from 'react'
import useScrollReveal from '../../lib/useScrollReveal'
import './AboutSection.css'

export default function AboutSection() {
  const ref = useRef(null)
  const visible = useScrollReveal(ref, { threshold: 0.3 })
  
  return (
    <section ref={ref} className="about">
      <div className={`about-block intro${visible ? ' visible' : ''}`}>
        <h2 className="about-title" aria-label="Oro learns your style.">
          <span className="about-line about-line-main">Oro learns</span>
          <span className="about-line about-line-accent">your style.</span>
        </h2>
        <p className="about-tagline">And makes it happen.</p>
      </div>
    </section>
  )
}
