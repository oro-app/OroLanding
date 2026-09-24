import { useEffect, useRef } from 'react'

export function useHomeMotion() {
  const ref = useRef(null)

  useEffect(() => {
    const root = ref.current
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!root || preference.matches) return undefined

    root.dataset.motion = 'ready'
    const sections = [...root.querySelectorAll('[data-home-reveal]')]
    const reveal = (section) => {
      section.dataset.revealState = 'shown'
      observer?.unobserve(section)
    }
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target)
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' })
      : null

    if (observer) {
      sections.forEach((section) => {
        section.dataset.revealState = 'pending'
        observer.observe(section)
      })
    }

    const onFocus = (event) => {
      const section = event.target.closest('[data-home-reveal]')
      if (section) reveal(section)
    }
    const onPreferenceChange = () => {
      if (!preference.matches) return
      root.dataset.motion = 'reduced'
      sections.forEach(reveal)
      observer?.disconnect()
    }

    root.addEventListener('focusin', onFocus)
    preference.addEventListener('change', onPreferenceChange)
    return () => {
      observer?.disconnect()
      root.removeEventListener('focusin', onFocus)
      preference.removeEventListener('change', onPreferenceChange)
      delete root.dataset.motion
      sections.forEach((section) => delete section.dataset.revealState)
    }
  }, [])

  return ref
}
