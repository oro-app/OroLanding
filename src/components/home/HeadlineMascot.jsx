import { useEffect, useRef } from 'react'
import mascot from '../../assets/mascot/oro_hi.webp'
import './HeadlineMascot.css'

export default function HeadlineMascot({ revealed }) {
  const ref = useRef(null)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const reset = () => {
      ref.current?.style.removeProperty('--eye-x')
      ref.current?.style.removeProperty('--eye-y')
    }
    const follow = (event) => {
      if (!revealed || preference.matches || event.pointerType === 'touch') return
      const rect = ref.current.getBoundingClientRect()
      const dx = event.clientX - rect.left - rect.width * .52
      const dy = event.clientY - rect.top - rect.height * .39
      const distance = Math.max(160, Math.hypot(dx, dy))
      ref.current.style.setProperty('--eye-x', `${dx / distance * .8}%`)
      ref.current.style.setProperty('--eye-y', `${dy / distance * .8}%`)
    }
    window.addEventListener('pointermove', follow, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    preference.addEventListener('change', reset)
    return () => {
      window.removeEventListener('pointermove', follow)
      document.documentElement.removeEventListener('pointerleave', reset)
      preference.removeEventListener('change', reset)
    }
  }, [revealed])

  return <span className="home-headline-mascot" data-revealed={revealed} aria-hidden="true">
    <span className="home-headline-mascot-art" ref={ref}>
      <img src={mascot} alt="" width="1500" height="1500" />
      <span className="home-mascot-eye-cover home-mascot-eye-cover--left" />
      <span className="home-mascot-eye-cover home-mascot-eye-cover--right" />
      <img className="home-mascot-eye home-mascot-eye--left" src={mascot} alt="" width="1500" height="1500" />
      <img className="home-mascot-eye home-mascot-eye--right" src={mascot} alt="" width="1500" height="1500" />
    </span>
  </span>
}
