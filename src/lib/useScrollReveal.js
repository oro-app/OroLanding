import { useEffect, useState } from 'react'

export default function useScrollReveal(ref, options = {}) {
  const {
    threshold = 0.25,
    rootMargin = '0px 0px -12% 0px',
  } = options

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current

    if (!node) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold, rootMargin }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [ref, threshold, rootMargin])

  return isVisible
}