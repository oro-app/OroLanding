import { useEffect, useRef, useState } from 'react'
import './AboutSection.css'

export default function AboutSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
        }
      },
      { threshold: 0.3 }
    )
    
    if (ref.current) {
      observer.observe(ref.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <section className="about">
      <div ref={ref} className={`about-block intro${visible ? ' visible' : ''}`}>
        <h2 className="about-title" aria-label="Oro learns your style.">
          <span className="about-line about-line-main">Oro learns</span>
          <span className="about-line about-line-accent">your style.</span>
        </h2>
        <p className="about-tagline">And makes it happen.</p>
      </div>
    </section>
  )
}
