import { useEffect, useRef } from 'react'
import { createGoldEffect } from './goldEffect'
import './GoldBackground.css'

export default function GoldBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const surface = canvas.parentElement
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = matchMedia('(pointer: fine)')
    const effect = createGoldEffect()
    let width = 0
    let height = 0
    let frame = 0
    let previous = 0
    let points = []
    let target = null
    let follower = null
    const allowed = () => !motion.matches && pointer.matches && !document.hidden
    const clear = () => ctx.clearRect(0, 0, width, height)

    function reset() {
      cancelAnimationFrame(frame)
      frame = 0
      previous = 0
      points = []
      target = follower = null
      clear()
    }

    function resize() {
      reset()
      width = window.innerWidth
      height = window.innerHeight
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      ctx.setTransform(scale, 0, 0, scale, 0, 0)
      effect.resize?.(width, height)
    }

    function draw(time) {
      frame = 0
      if (!allowed()) return reset()
      const dt = previous ? Math.min(time - previous, 48) : 16
      previous = time
      if (target) {
        const ease = 1 - Math.exp(-dt / 75)
        follower.x += (target.x - follower.x) * ease
        follower.y += (target.y - follower.y) * ease
        const last = points.at(-1)
        if (!last || Math.hypot(follower.x - last.x, follower.y - last.y) > .22) {
          points.push({ ...follower, time })
        }
      }
      points = points.filter(point => time - point.time < effect.duration)
      clear()
      effect.draw(ctx, points, time, width, height)
      const settling = target && Math.hypot(target.x - follower.x, target.y - follower.y) > .22
      if (points.length || settling) frame = requestAnimationFrame(draw)
      else previous = 0
    }

    function move(event) {
      if (!allowed() || event.pointerType === 'touch') return
      target = { x: event.clientX, y: event.clientY }
      if (!follower) {
        follower = { ...target }
        points = []
      }
      if (!frame) frame = requestAnimationFrame(draw)
    }

    function leave() {
      target = follower = null
    }

    resize()
    surface.addEventListener('pointermove', move, { passive: true })
    surface.addEventListener('pointerleave', leave)
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', reset, { passive: true, capture: true })
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', reset)
    motion.addEventListener('change', reset)
    pointer.addEventListener('change', reset)
    return () => {
      reset()
      surface.removeEventListener('pointermove', move)
      surface.removeEventListener('pointerleave', leave)
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', reset, true)
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', reset)
      motion.removeEventListener('change', reset)
      pointer.removeEventListener('change', reset)
    }
  }, [])

  return <canvas ref={ref} className="gold-background" aria-hidden="true" />
}
