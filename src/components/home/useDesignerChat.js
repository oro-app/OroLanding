import { useEffect, useRef, useState } from 'react'

export function useDesignerChat(ref, messageCount, channel) {
  const [shown, setShown] = useState(messageCount)
  const [typing, setTyping] = useState(null)
  const [target, setTarget] = useState(messageCount)
  const [reduced, setReduced] = useState(true)
  const [clock, setClock] = useState('')
  const glides = useRef(new Map())

  useEffect(() => {
    const format = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true })
    let timer
    const tick = () => {
      setClock(format.formatToParts(new Date()).filter((part) => ['hour', 'minute', 'literal'].includes(part.type)).map((part) => part.value).join('').trim())
      timer = setTimeout(tick, 60000 - Date.now() % 60000 + 50)
    }
    tick()
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const section = ref.current
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const update = () => {
      frame = 0
      const pin = section.querySelector('.oro-intro-pin')
      const box = section.querySelector('.product-demo-thread')
      if (motion.matches) {
        setReduced(true)
        setTarget(messageCount)
        setShown(messageCount)
        setTyping(null)
        return
      }
      setReduced(false)
      let top = innerWidth <= 768 ? 94 : 112
      const threadOffset = box.getBoundingClientRect().top - pin.getBoundingClientRect().top
      top = Math.min(top, innerHeight - 360 - threadOffset)
      section.style.setProperty('--oro-pin-top', `${Math.round(top)}px`)
      section.style.setProperty('--oro-chat-track', `${(messageCount - 1) * 300 + 320}px`)
      const start = section.getBoundingClientRect().top + scrollY + parseFloat(getComputedStyle(section).paddingTop) - top
      const distance = scrollY - start
      setTarget(distance < -120 ? 0 : Math.max(0, Math.min(messageCount, Math.floor(distance / 300) + 1)))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const resize = new ResizeObserver(schedule)
    resize.observe(section.querySelector('.oro-intro-pin'))
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    motion.addEventListener('change', schedule)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      motion.removeEventListener('change', schedule)
    }
  }, [ref, messageCount])

  useEffect(() => {
    if (reduced) return
    if (shown > target) {
      setShown(target)
      setTyping(null)
      return
    }
    if (shown === target) { setTyping(null); return }
    setTyping(shown)
    const time = [300, 620, 140, 300, 620, 140][shown] * (target - shown > 1 ? .35 : 1)
    const timer = setTimeout(() => {
      setShown(shown + 1)
      setTyping(null)
    }, time)
    return () => clearTimeout(timer)
  }, [shown, target, reduced])

  useEffect(() => {
    const section = ref.current
    const boxes = [...section.querySelectorAll('.product-demo-thread, .oro-wa-chat')]
    const frames = glides.current
    const glide = (box, to) => {
      cancelAnimationFrame(frames.get(box))
      if (reduced || document.hidden) { box.scrollTop = to; return }
      const from = box.scrollTop
      const start = performance.now()
      const step = (time) => {
        const progress = Math.min(1, (time - start) / 380)
        box.scrollTop = from + (to - from) * (1 - (1 - progress) ** 3)
        if (progress < 1) frames.set(box, requestAnimationFrame(step))
      }
      frames.set(box, requestAnimationFrame(step))
    }
    boxes.forEach((box) => {
      const items = box.querySelectorAll('.product-demo-message, .oro-wa-msg')
      const last = items[Math.min(items.length - 1, typing ?? shown - 1)]
      if (!last) { glide(box, 0); return }
      const bounds = box.getBoundingClientRect()
      const visible = reduced ? box.clientHeight : Math.min(box.clientHeight, innerHeight - 20 - bounds.top)
      const bottom = last.getBoundingClientRect().bottom - bounds.top + box.scrollTop
      glide(box, Math.max(0, bottom + 44 - Math.max(120, visible)))
    })
    return () => boxes.forEach((box) => cancelAnimationFrame(frames.get(box)))
  }, [ref, shown, typing, reduced, channel])

  useEffect(() => {
    const section = ref.current
    const wheel = (event) => {
      if (event.ctrlKey) return
      const phone = event.target.closest('.product-demo, .oro-wa-phone')
      if (!phone) return
      const box = phone.querySelector('.product-demo-thread, .oro-wa-chat')
      const items = box.querySelectorAll('.product-demo-message, .oro-wa-msg')
      const last = items[shown - 1]
      if (!last) return
      const bounds = box.getBoundingClientRect()
      const visible = Math.min(box.clientHeight, innerHeight - 20 - bounds.top)
      const bottom = last.getBoundingClientRect().bottom - bounds.top + box.scrollTop
      const max = Math.max(box.scrollTop, bottom + 18 - Math.max(120, visible))
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaMode === 2 ? event.deltaY * box.clientHeight : event.deltaY
      const next = Math.max(0, Math.min(max, box.scrollTop + delta))
      if (Math.abs(next - box.scrollTop) < .5) return
      event.preventDefault()
      cancelAnimationFrame(glides.current.get(box))
      box.scrollTop = next
    }
    section.addEventListener('wheel', wheel, { passive: false })
    return () => section.removeEventListener('wheel', wheel)
  }, [ref, shown])

  return { shown, typing, reduced, clock }
}
