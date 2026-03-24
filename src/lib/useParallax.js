import { useEffect, useRef } from 'react'

export default function useParallax(speed = 0.3) {
  const ref = useRef(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const update = () => {
      const rect = node.getBoundingClientRect()
      const viewH = window.innerHeight
      const center = rect.top + rect.height / 2 - viewH / 2
      node.style.transform = `translate3d(0, ${center * speed * -1}px, 0)`
    }

    const onScroll = () => requestAnimationFrame(update)

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => window.removeEventListener('scroll', onScroll)
  }, [speed])

  return ref
}
