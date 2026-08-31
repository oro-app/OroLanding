import { useEffect, useRef, useState } from 'react'
import lookDay from '../../assets/home/look-day.png'
import lookNight from '../../assets/home/look-night.png'

// The thread is transcribed from Oro-Mobile-Refresh's MigrationDemoThread, and
// the timings below are that component's shipped values in ms. SLOW stretches
// them so the loop reads at browsing pace rather than texting pace.
const SLOW = 1.45
const RECEIPT_DELAY = 260
const REPLAY_GAP = 4200

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

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

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
      <div className="mt-bubble mt-bubble--oro mt-typing" aria-label="oro is typing">
        <i /><i /><i />
      </div>
      <Tail from="oro" />
    </div>
  )
}

export default function MessageThread() {
  // Bumping cycle remounts the thread, which is what restarts the reveal
  // animations: re-rendering the same elements would not replay them.
  const [step, setStep] = useState(-1)
  const [receipt, setReceipt] = useState(false)
  const [cycle, setCycle] = useState(0)
  const [staticThread, setStaticThread] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStaticThread(true)
      setStep(STEPS.length - 1)
      setReceipt(true)
      return undefined
    }

    const queue = timers.current
    setStep(-1)
    setReceipt(false)

    STEPS.forEach((item, index) => {
      queue.push(setTimeout(() => setStep(index), item.at * SLOW))
    })
    queue.push(setTimeout(() => setReceipt(true), LAST_AT + RECEIPT_DELAY))
    queue.push(setTimeout(() => setCycle((value) => value + 1), LAST_AT + REPLAY_GAP))

    return () => {
      queue.forEach(clearTimeout)
      timers.current = []
    }
  }, [cycle])

  // A typing indicator disappears once the message it stood in for arrives.
  const isVisible = (item, index) => {
    if (index > step) return false
    if (staticThread) return !item.typing
    if (!item.typing) return true
    return !STEPS.some((other, otherIndex) => other.hides === item.typing && otherIndex <= step)
  }

  return (
    <div className="mt-device">
      <div className="mt-notch" />
      <div className="mt-screen">
        <div className="mt-statusbar">
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
            <span className="mt-avatar">o</span>
            <span className="mt-contact-name">oro</span>
          </div>
          <span />
        </div>

        <div className="mt-thread" key={cycle}>
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
  )
}
