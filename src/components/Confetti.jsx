import { useEffect, useRef } from 'react'
import './Confetti.css'

const PALETTE_VARS = ['--oro-gold', '--oro-gold-dim', '--oro-plum-deep', '--oro-plum-soft', '--oro-accent-text']
const FALLBACK_COLORS = ['#D4A853', '#bd8d2f', '#3A2646', '#493058', '#8D691D']
const PIECE_COUNT = 140
const DURATION_MS = 3200
const GRAVITY = 0.32
const DRAG = 0.985

function readPalette() {
  const styles = getComputedStyle(document.documentElement)
  const colors = PALETTE_VARS.map((name) => styles.getPropertyValue(name).trim()).filter(Boolean)
  return colors.length ? colors : FALLBACK_COLORS
}

function makePiece(width, height, colors) {
  // Two bursts from the lower corners, angled up and toward the centre.
  const fromLeft = Math.random() < 0.5
  const angle = (fromLeft ? -60 : -120) + (Math.random() - 0.5) * 40
  const speed = 11 + Math.random() * 9
  const radians = (angle * Math.PI) / 180
  return {
    x: fromLeft ? width * 0.1 : width * 0.9,
    y: height * 0.95,
    vx: Math.cos(radians) * speed,
    vy: Math.sin(radians) * speed - Math.random() * 4,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    rotation: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.35,
    tilt: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }
}

/** One-shot confetti burst over the page. Renders nothing for reduced-motion users. */
export default function Confetti() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const colors = readPalette()
    const pieces = Array.from({ length: PIECE_COUNT }, () => makePiece(width, height, colors))
    const start = performance.now()
    let frame = 0

    const draw = (now) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, width, height)
      // Fade out over the last 600ms so nothing pops off screen.
      ctx.globalAlpha = Math.max(0, Math.min(1, (DURATION_MS - elapsed) / 600))
      for (const p of pieces) {
        p.vx *= DRAG
        p.vy = p.vy * DRAG + GRAVITY
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.spin
        p.tilt += 0.1
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.scale(1, Math.cos(p.tilt))
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
      if (elapsed < DURATION_MS) frame = requestAnimationFrame(draw)
      else ctx.clearRect(0, 0, width, height)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [])

  return <canvas ref={canvasRef} className="oro-confetti" aria-hidden="true" data-testid="onboarding-confetti" />
}
