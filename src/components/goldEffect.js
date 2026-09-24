export function createGoldEffect() {
  const duration = 2400
  const foil = document.createElement('canvas')
  const mask = document.createElement('canvas')
  const foilCtx = foil.getContext('2d')
  const maskCtx = mask.getContext('2d')
  return {
    duration,
    resize(width, height) {
      foil.width = mask.width = Math.ceil(width)
      foil.height = mask.height = Math.ceil(height)
      const gradient = foilCtx.createLinearGradient(0, height, width, 0)
      gradient.addColorStop(0, '#b48a46')
      gradient.addColorStop(.2, '#e6c991')
      gradient.addColorStop(.37, '#c9a36b')
      gradient.addColorStop(.5, '#fff2cc')
      gradient.addColorStop(.59, '#d8b47a')
      gradient.addColorStop(.78, '#b98d48')
      gradient.addColorStop(1, '#f4dfb8')
      foilCtx.fillStyle = gradient
      foilCtx.fillRect(0, 0, width, height)
      for (let y = -height; y < height * 2; y += 6) {
        foilCtx.beginPath()
        foilCtx.moveTo(0, y)
        foilCtx.bezierCurveTo(width * .25, y - 80, width * .62, y + 90, width, y - 110)
        foilCtx.strokeStyle = y % 12 === 0 ? '#fff8e022' : '#9d713515'
        foilCtx.lineWidth = y % 18 === 0 ? 1.3 : .5
        foilCtx.stroke()
      }
    },
    draw(ctx, points, time, width, height) {
      maskCtx.clearRect(0, 0, width, height)
      maskCtx.globalCompositeOperation = 'source-over'
      for (const point of points) {
        const life = Math.pow(1 - (time - point.time) / duration, 1.25)
        const radius = Math.min(width, height) * .14
        const gradient = maskCtx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius)
        gradient.addColorStop(0, `rgba(255,255,255,${life * .27})`)
        gradient.addColorStop(.4, `rgba(255,255,255,${life * .19})`)
        gradient.addColorStop(1, 'rgba(255,255,255,0)')
        maskCtx.fillStyle = gradient
        maskCtx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2)
      }
      maskCtx.globalCompositeOperation = 'source-in'
      maskCtx.drawImage(foil, 0, 0)
      ctx.save()
      ctx.globalAlpha = .65 * .85
      ctx.drawImage(mask, 0, 0)
      ctx.restore()
    },
  }
}
