import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// One-shot scroll reveal: flips to true the first time the element crosses the
// threshold, then stops observing. Reduced motion resolves immediately, so the
// content is never gated behind a scroll that will not animate.
export function useRevealOnScroll(threshold = 0.1) {
  const ref = useRef(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setRevealed(true)
      return undefined
    }
    const el = ref.current
    if (!el || revealed) return undefined

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          obs.disconnect()
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [revealed, threshold])

  return [ref, revealed]
}
