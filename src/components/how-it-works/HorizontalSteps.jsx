import { useEffect, useRef, useState } from 'react'
import './HorizontalSteps.css'

// Scroll-jacked horizontal stepper. Classic pinned-sticky pattern:
// the outer <section> is (n × 110vh) tall, with a position:sticky inner
// viewport that stays pinned for the duration. The step track translateX-es
// from 0 to -(n-1) × 100vw as scroll progress goes 0 → 1.
//
// Listeners: a rAF tick PLUS explicit scroll/wheel/resize handlers — rAF
// alone misses first-wheel input and pauses in hidden tabs. Progress is
// rounded to 4 decimals before setState so React doesn't re-render 60×/sec.

function StepPanel({ step, index, total, progress }) {
  // Per-step "active-ness" — 0..1, peaks when this step is centered in
  // viewport. Drives the entrance choreography below.
  const center = total > 1 ? index / (total - 1) : 0.5
  const span = 1 / (total - 1)
  const dist = Math.abs(progress - center) / span
  const local = Math.max(0, 1 - dist)

  // Entrance values. The *1.4 and *1.6 multipliers make opacity hit 1
  // before the step is perfectly centered, which feels snappier than a
  // strict linear ramp.
  const textOpacity   = Math.min(1, local * 1.4)
  const textShift     = (1 - local) * 36 // px
  const phoneScale    = 0.92 + local * 0.08
  const phoneOpacity  = Math.min(1, local * 1.6)
  const floatRunning  = local > 0.4

  return (
    <div className="hi-panel">
      <div
        className="hi-text"
        style={{
          opacity: textOpacity,
          transform: `translateY(${textShift}px)`,
        }}
      >
        <div className="hi-eyebrow">step {step.n}.</div>
        <h2 className="hi-title">{step.title}</h2>
        <p className="hi-body">{step.body}</p>
      </div>

      <div className="hi-phone-col" style={{ opacity: phoneOpacity }}>
        <div className="hi-phone-scale" style={{ transform: `scale(${phoneScale})` }}>
          <div className="hi-phone-float" style={{ animationPlayState: floatRunning ? 'running' : 'paused' }}>
            <img
              className="hi-phone-img"
              src={step.img}
              alt={step.title}
              width="1230" height="2652"
              loading="eager" decoding="async" draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HorizontalSteps({ steps }) {
  const outerRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280)

  // Per-frame progress compute. Driven by both rAF and direct listeners.
  useEffect(() => {
    let raf = 0
    let lastP = -1
    function compute() {
      const outer = outerRef.current
      if (!outer) return
      const rect = outer.getBoundingClientRect()
      const viewportH = window.innerHeight
      const totalScroll = outer.offsetHeight - viewportH
      if (totalScroll <= 0) return
      const scrolled = -rect.top
      const p = Math.max(0, Math.min(1, scrolled / totalScroll))
      const q = Math.round(p * 10000) / 10000
      if (q !== lastP) { lastP = q; setProgress(q) }
    }
    function tick() {
      compute()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const handler = () => compute()
    const onResize = () => { setVw(window.innerWidth); compute() }
    window.addEventListener('scroll', handler, { passive: true })
    window.addEventListener('wheel', handler, { passive: true })
    window.addEventListener('resize', onResize)
    compute()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', handler)
      window.removeEventListener('wheel', handler)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  const total = steps.length
  const translatePx = -progress * (total - 1) * vw
  const activeIndex = Math.round(progress * (total - 1))
  const eyebrowOpacity = 1 - Math.min(1, progress * 6)
  const hintVisible = progress < 0.05

  return (
    <section
      ref={outerRef}
      className="hi-section"
      style={{ height: `${total * 110}vh` }}
      aria-label="how oro works in four steps"
    >
      <div className="hi-sticky">
        {/* Section eyebrow — fades after first scroll */}
        <div className="hi-section-eyebrow" style={{ opacity: eyebrowOpacity }}>
          <span>scroll to step through.</span>
        </div>

        {/* The track — translateX driven by scroll progress */}
        <div
          className="hi-track"
          style={{ transform: `translate3d(${translatePx}px, 0, 0)` }}
        >
          {steps.map((s, i) => (
            <StepPanel key={s.n} step={s} index={i} total={total} progress={progress} />
          ))}
        </div>

        {/* Progress dots — bottom center */}
        <div className="hi-dots" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`hi-dot${i === activeIndex ? ' is-active' : ''}`}
            />
          ))}
        </div>

        {/* "scroll →" hint — fades out after first scroll */}
        <div className="hi-hint" style={{ opacity: hintVisible ? 1 : 0 }} aria-hidden="true">
          scroll
          <svg width="32" height="10" viewBox="0 0 32 10" fill="none">
            <path d="M0 5h28M22 1l6 4-6 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </section>
  )
}
