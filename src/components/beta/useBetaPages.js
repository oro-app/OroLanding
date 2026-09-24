import { useCallback, useEffect, useRef, useState } from 'react'

export function useBetaPages(count, onComplete) {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const current = useRef(0)
  const transition = useRef(null)
  const timers = useRef([])
  const focusNext = useRef(false)
  const reducedMotion = useRef(false)
  const [page, setPage] = useState({ index: 0, phase: 'idle', direction: 1 })

  const finish = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (!transition.current) return
    const { index, direction } = transition.current
    current.current = index
    transition.current = null
    setPage({ index, direction, phase: 'idle' })
  }, [])

  const goTo = useCallback((index, keyboard = false) => {
    if (transition.current || index < 0 || index > count || index === current.current) return
    if (index === count) {
      onComplete()
      return
    }
    const direction = Math.sign(index - current.current)
    focusNext.current = keyboard || stageRef.current?.contains(document.activeElement)
    transition.current = { index, direction }
    if (reducedMotion.current) {
      finish()
      return
    }
    setPage({ index: current.current, direction, phase: 'leaving' })
    timers.current.push(setTimeout(() => {
      current.current = index
      setPage({ index, direction, phase: 'entering' })
    }, 280))
    timers.current.push(setTimeout(finish, 1030))
  }, [count, finish, onComplete])

  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0, behavior: 'instant' })
    if (focusNext.current) {
      stageRef.current?.querySelector('h1, h2')?.focus({ preventScroll: true })
      focusNext.current = false
    }
  }, [page.index])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => {
      reducedMotion.current = preference.matches
      if (preference.matches) finish()
    }
    sync()
    preference.addEventListener('change', sync)
    return () => {
      preference.removeEventListener('change', sync)
      timers.current.forEach(clearTimeout)
    }
  }, [finish])

  useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canScroll = (direction) => direction > 0
      ? stage.scrollHeight - stage.clientHeight - stage.scrollTop > 2
      : stage.scrollTop > 2
    let gesture = { last: 0, total: 0, locked: false, direction: 0 }
    let touch = null

    const onWheel = (event) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return
      const now = performance.now()
      const direction = Math.sign(event.deltaY)
      if (now - gesture.last > 220 || (!transition.current && direction !== gesture.direction)) {
        gesture = { last: now, total: 0, locked: false, direction }
      }
      gesture.last = now
      gesture.direction = direction
      if (!transition.current && canScroll(direction) && stage.contains(event.target)) {
        gesture.locked = true
        return
      }
      event.preventDefault()
      if (transition.current || gesture.locked) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1)
      if (Math.sign(gesture.total) !== direction) gesture.total = 0
      gesture.total += delta
      if (Math.abs(gesture.total) >= 55) {
        gesture.locked = true
        goTo(current.current + direction)
      }
    }
    const onTouchStart = (event) => {
      if (event.touches.length !== 1) { touch = null; return }
      touch = { x: event.touches[0].clientX, y: event.touches[0].clientY, next: !canScroll(1), previous: !canScroll(-1) }
    }
    const onTouchMove = (event) => {
      if (!touch || event.touches.length !== 1) return
      const distance = touch.y - event.touches[0].clientY
      const horizontal = Math.abs(touch.x - event.touches[0].clientX)
      if (Math.abs(distance) > Math.max(10, horizontal) && (transition.current || (distance > 0 ? touch.next : touch.previous))) event.preventDefault()
    }
    const onTouchEnd = (event) => {
      if (!touch || !event.changedTouches.length) return
      const distance = touch.y - event.changedTouches[0].clientY
      const horizontal = Math.abs(touch.x - event.changedTouches[0].clientX)
      if (Math.abs(distance) > 60 && Math.abs(distance) > horizontal && (distance > 0 ? touch.next : touch.previous)) {
        goTo(current.current + Math.sign(distance))
      }
      touch = null
    }
    const onTouchCancel = () => { touch = null }
    const onKeyDown = (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return
      const direction = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey) ? 1
        : ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey) ? -1 : 0
      if (event.key === ' ' && event.target.closest('button, a')) return
      if (!direction && !['Home', 'End'].includes(event.key)) return
      event.preventDefault()
      if (transition.current) return
      if (direction && canScroll(direction)) {
        stage.scrollBy({ top: direction * stage.clientHeight * .8, behavior: reducedMotion.current ? 'instant' : 'smooth' })
        return
      }
      goTo(event.key === 'Home' ? 0 : event.key === 'End' ? count - 1 : current.current + direction, true)
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('touchstart', onTouchStart, { passive: true })
    root.addEventListener('touchmove', onTouchMove, { passive: false })
    root.addEventListener('touchend', onTouchEnd)
    root.addEventListener('touchcancel', onTouchCancel)
    root.addEventListener('keydown', onKeyDown)
    return () => {
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('touchstart', onTouchStart)
      root.removeEventListener('touchmove', onTouchMove)
      root.removeEventListener('touchend', onTouchEnd)
      root.removeEventListener('touchcancel', onTouchCancel)
      root.removeEventListener('keydown', onKeyDown)
    }
  }, [count, goTo])

  return { rootRef, stageRef, page, goTo }
}
