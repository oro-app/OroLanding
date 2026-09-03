import { useEffect, useRef, useState } from 'react'

const PIN_MIN_WIDTH = 901

function canPin() {
  if (typeof window === 'undefined') return false
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
  return window.innerWidth >= PIN_MIN_WIDTH
}

// Drives a pinned "stage" whose panels swap as the page scrolls past a tall
// scroller. Returns the active panel index, or null when pinning is off, in
// which case the caller should render the panels stacked as normal flow.
export function usePinnedPanels(
  count,
  firstPanelShare = 1 / count,
  secondPanelShare = (1 - firstPanelShare) / (count - 1),
) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    const evaluate = () => setPinned(canPin())
    evaluate()
    window.addEventListener('resize', evaluate)
    return () => window.removeEventListener('resize', evaluate)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!pinned || !el || count < 1) return undefined

    let frame = 0
    const measure = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const stage = el.firstElementChild
      if (!stage) return
      // Travel is measured against the pinned stage, not the viewport, so the
      // configured first shares and the evenly split remainder fill the scroll.
      const travel = rect.height - stage.getBoundingClientRect().height
      const progress = travel > 0 ? -rect.top / travel : 0
      const index = count === 1 || progress < firstPanelShare
        ? 0
        : count === 2 || progress < firstPanelShare + secondPanelShare
          ? 1
          : 2 + Math.floor(
            ((progress - firstPanelShare - secondPanelShare)
              / (1 - firstPanelShare - secondPanelShare)) * (count - 2),
          )
      setActive(Math.min(count - 1, Math.max(0, index)))
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [pinned, count, firstPanelShare, secondPanelShare])

  return [ref, pinned ? active : null]
}
