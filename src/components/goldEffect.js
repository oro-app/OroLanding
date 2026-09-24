export function createGoldEffect() {
  const duration = 780
  const strength = .65
  return {
    duration,
    draw(ctx, points, time) {
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]
        const b = points[i]
        const life = 1 - (time - b.time) / duration
        const taper = Math.sin(Math.min(i / points.length, .92) * Math.PI * .85)
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.lineWidth = (.6 + taper * 2.2) * life
        ctx.strokeStyle = `rgba(191,143,68,${life * strength * .85})`
        ctx.shadowColor = `rgba(212,174,108,${life * strength * .75})`
        ctx.shadowBlur = 9
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.lineWidth *= .28
        ctx.strokeStyle = `rgba(255,242,206,${life * strength})`
        ctx.stroke()
      }
      const end = points.at(-1)
      if (!end) return
      const alpha = (1 - (time - end.time) / duration) * strength * .5
      const glow = ctx.createRadialGradient(end.x, end.y, 0, end.x, end.y, 17)
      glow.addColorStop(0, `rgba(250,224,173,${alpha})`)
      glow.addColorStop(.3, `rgba(217,172,103,${alpha * .45})`)
      glow.addColorStop(1, 'rgba(217,172,103,0)')
      ctx.fillStyle = glow
      ctx.fillRect(end.x - 17, end.y - 17, 34, 34)
    },
  }
}
