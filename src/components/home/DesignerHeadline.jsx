import { Fragment, useEffect, useRef, useState } from 'react'

const HEADLINE = 'the ai fashion assistant you can text'
const PHRASES = ['you can text', 'that knows your closet', 'that gets your style', 'tuned to your taste', 'with your wardrobe on file']
const EMPHASIS = [2, 3, 3, 3, 2]

export default function DesignerHeadline() {
  const [active, setActive] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)')
    let interval
    let timeout
    let frame = 0
    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0
    const tick = () => {
      x += (targetX - x) * .14
      y += (targetY - y) * .14
      ref.current?.style.setProperty('--oro-eye-x', `${x}%`)
      ref.current?.style.setProperty('--oro-eye-y', `${y}%`)
      frame = Math.abs(targetX - x) > .005 || Math.abs(targetY - y) > .005 ? requestAnimationFrame(tick) : 0
    }
    const reset = () => {
      targetX = targetY = 0
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const follow = (event) => {
      if (motion.matches || event.pointerType === 'touch') return
      const word = ref.current?.querySelector('.oro-hi-anchor')
      if (!word) return
      const rect = word.getBoundingClientRect()
      const size = parseFloat(getComputedStyle(word).fontSize)
      const dx = event.clientX - (rect.right - .465 * size)
      const dy = event.clientY - (rect.top + rect.height / 2)
      const distance = Math.hypot(dx, dy) || 1
      const reach = Math.min(1, distance / 520)
      targetX = dx / distance * reach * 2.2
      targetY = dy / distance * reach * 2.4
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const configure = () => {
      clearInterval(interval)
      clearTimeout(timeout)
      if (motion.matches) {
        setActive(0)
        reset()
      } else {
        timeout = setTimeout(() => {
          setActive((value) => (value + 1) % PHRASES.length)
          interval = setInterval(() => setActive((value) => (value + 1) % PHRASES.length), 2200)
        }, 80 + (HEADLINE.replaceAll(' ', '').length - 1) * 34 + 900)
      }
    }
    configure()
    motion.addEventListener('change', configure)
    window.addEventListener('pointermove', follow, { passive: true })
    document.documentElement.addEventListener('pointerleave', reset)
    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
      cancelAnimationFrame(frame)
      motion.removeEventListener('change', configure)
      window.removeEventListener('pointermove', follow)
      document.documentElement.removeEventListener('pointerleave', reset)
    }
  }, [])

  let character = 0
  const typed = (word) => [...word].map((letter, index) => <span className="home-type-char" key={index} style={{ '--home-char-delay': `${80 + character++ * 34}ms` }}>{letter}</span>)
  return <span ref={ref} aria-hidden="true">
    {'the ai fashion assistant'.split(' ').map((word, index) => <Fragment key={word}>
      <span className={`home-type-word${index === 2 ? ' oro-hi-anchor' : ''}`}>{typed(word)}</span>{index < 3 ? ' ' : null}
    </Fragment>)}
    <br />
    <span className="oro-rot">{PHRASES.map((phrase, index) => <span className="oro-rot-phrase" key={phrase}
      data-state={index === active ? 'in' : index === (active + PHRASES.length - 1) % PHRASES.length ? 'out' : 'wait'}>
      {phrase.split(' ').map((word, wordIndex, words) => {
        const Word = wordIndex === EMPHASIS[index] ? 'em' : 'span'
        return <Fragment key={wordIndex}><Word className={`home-type-word${wordIndex === words.length - 1 ? ' oro-last' : ''}`}>{index === 0 ? typed(word) : word}</Word>{wordIndex < words.length - 1 ? ' ' : null}</Fragment>
      })}
    </span>)}</span>
  </span>
}
