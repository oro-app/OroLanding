import { useEffect, useRef, useState } from 'react'
import lookDay from '../../assets/home/look-day.webp'
import lookNight from '../../assets/home/look-night.webp'

// The thread is transcribed from Oro-Mobile-Refresh's MigrationDemoThread, and
// the timings below are that component's shipped values in ms. SLOW stretches
// them so the sequence reads at browsing pace rather than texting pace.
const SLOW = 1.45
const RECEIPT_DELAY = 260

const STEPS = [
  { at: 300, from: 'user', text: 'i have class then dinner with someone tonight, no idea what to wear' },
  { at: 1200, from: 'oro', typing: 't1' },
  {
    at: 2600,
    from: 'oro',
    hides: 't1',
    text: "cold and grey today, so we're layering - jeans, the black cami, cardigan over. how's this? 💜",
  },
  { at: 3200, from: 'oro', image: lookDay, alt: 'the look oro sent — grey jeans, black cami, cream cardigan' },
  { at: 4300, from: 'user', text: 'obsessed 😍 can we swap the jeans for a skirt though?' },
  { at: 5300, from: 'oro', typing: 't2' },
  {
    at: 6500,
    from: 'oro',
    hides: 't2',
    text: "easy - your cargo mini. i'm switching the sneakers for the suede boots, trust me 💜",
  },
  { at: 7100, from: 'oro', image: lookNight, alt: 'the same look with the cargo mini and suede boots' },
  { at: 8000, from: 'user', text: "ok yes. i'm wearing this ✨" },
]

const LAST_AT = Math.max(...STEPS.map((step) => step.at)) * SLOW

function Tail({ from }) {
  return (
    <>
      <span className={`mt-tail mt-tail--${from}`} />
      <span className={`mt-tail-mask mt-tail-mask--${from}`} />
    </>
  )
}

function TypingBubble() {
  return (
    <div className="mt-row mt-row--oro">
      <div className="mt-bubble mt-bubble--oro mt-typing" aria-hidden="true">
        <i /><i /><i />
      </div>
      <Tail from="oro" />
    </div>
  )
}

export default function MessageThread({ startDelay = 0 }) {
  const [step, setStep] = useState(-1)
  const [receipt, setReceipt] = useState(false)
  const [staticThread, setStaticThread] = useState(false)
  const [motionReduced, setMotionReduced] = useState(false)
  const [hasEnteredView, setHasEnteredView] = useState(false)
  const deviceRef = useRef(null)
  const remainingDelay = useRef(startDelay)
  const timers = useRef([])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setMotionReduced(preference.matches)
    updatePreference()
    preference.addEventListener('change', updatePreference)
    return () => preference.removeEventListener('change', updatePreference)
  }, [])

  useEffect(() => {
    const device = deviceRef.current
    const observedAt = window.performance.now()
    const start = () => {
      remainingDelay.current = Math.max(0, startDelay - (window.performance.now() - observedAt))
      setHasEnteredView(true)
    }

    if (!device || !('IntersectionObserver' in window)) {
      start()
      return undefined
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      start()
    }, { threshold: 0.2 })

    observer.observe(device)
    return () => observer.disconnect()
  }, [startDelay])

  useEffect(() => {
    if (staticThread || motionReduced) {
      setStaticThread(true)
      setStep(STEPS.length - 1)
      setReceipt(true)
      return undefined
    }

    if (!hasEnteredView) return undefined

    const queue = timers.current
    const offset = remainingDelay.current
    setStep(-1)
    setReceipt(false)

    STEPS.forEach((item, index) => {
      queue.push(setTimeout(() => setStep(index), offset + item.at * SLOW))
    })
    queue.push(setTimeout(() => setReceipt(true), offset + LAST_AT + RECEIPT_DELAY))

    return () => {
      queue.forEach(clearTimeout)
      timers.current = []
    }
  }, [hasEnteredView, motionReduced, staticThread])

  // A typing indicator disappears once the message it stood in for arrives.
  const isVisible = (item, index) => {
    if (index > step) return false
    if (staticThread) return !item.typing
    if (!item.typing) return true
    return !STEPS.some((other, otherIndex) => other.hides === item.typing && otherIndex <= step)
  }

  return (
    <div ref={deviceRef} className="mt-device" role="region" aria-label="sample conversation with oro">
      <div className="mt-device-frame">
      <div className="mt-notch" />
      <div className="mt-screen">
        <div className="mt-statusbar" aria-hidden="true">
          <span>8:42</span>
          <span className="mt-status-right">
            <span className="mt-signal">
              <i /><i /><i /><i />
            </span>
            <span className="mt-battery" />
          </span>
        </div>

        <div className="mt-contact">
          <span className="mt-back" aria-hidden="true">‹</span>
          <div className="mt-contact-id">
            <span className="mt-avatar" aria-hidden="true">o</span>
            <span className="mt-contact-name">oro</span>
          </div>
          <span />
        </div>

        <div className="mt-transcript">
          <p><strong>Conversation transcript</strong></p>
          <ol>
            {STEPS.filter((item) => !item.typing).map((item) => (
              <li key={item.at}>
                <strong>{item.from === 'user' ? 'You' : 'Oro'}:</strong> {item.text || item.alt}
              </li>
            ))}
          </ol>
          <p>Delivered.</p>
        </div>

        <div className="mt-thread" aria-hidden="true">
          <p className="mt-stamp"><b>Today</b> 8:42 AM</p>

          {STEPS.map((item, index) => {
            if (!isVisible(item, index)) return null
            if (item.typing) return <TypingBubble key={item.typing} />
            if (item.image) {
              return <img key={item.at} className="mt-look" src={item.image} alt={item.alt} />
            }
            return (
              <div key={item.at} className={`mt-row mt-row--${item.from}`}>
                <div className={`mt-bubble mt-bubble--${item.from}`}>{item.text}</div>
                <Tail from={item.from} />
              </div>
            )
          })}

          <p className="mt-receipt" style={{ visibility: receipt ? 'visible' : 'hidden' }}>Delivered</p>
        </div>
      </div>
      </div>
    </div>
  )
}
