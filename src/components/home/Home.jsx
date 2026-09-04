import { useEffect, useState } from 'react'
import { Cta } from '@oro/web'
import { trackCtaClick } from '../../lib/analytics'
import { USER_COUNT } from '../../lib/stats'
import { usePinnedPanels } from '../../lib/usePinnedPanels'
import { useRevealOnScroll } from '../../lib/useRevealOnScroll'
import MessageThread from './MessageThread'

// Entrance choreography, in ms. The headline types itself, then the rest of the
// hero arrives in the order you read it, after a beat that lets the finished
// headline land before anything else moves.
const TYPE_STEP = 46
const AFTER_TYPING = 420
const HEADLINE = [
  { text: 'the #1 ai stylist you can ' },
  { text: 'text', accent: true },
]
const TYPED_CHARS = HEADLINE.reduce((n, part) => n + part.text.length, 0)
const TYPING_ENDS = TYPED_CHARS * TYPE_STEP

// The full headline stays in the prerendered HTML for crawlers while React
// advances one visible character and one shared caret at a time.
function TypedHeadline({ typedChars }) {
  let index = -1
  return HEADLINE.map((part, partIndex) => {
    const chars = [...part.text].map((char, charIndex) => {
      index += 1
      const visible = index < typedChars
      const hasCaret = index === typedChars - 1 && typedChars < TYPED_CHARS
      return (
        <span
          className={`tw-char${visible ? ' is-visible' : ''}`}
          key={`${partIndex}-${charIndex}`}
        >
          {char}
          {hasCaret ? <span className="tw-caret" aria-hidden="true" /> : null}
        </span>
      )
    })
    return part.accent ? <em key={partIndex}>{chars}</em> : <span key={partIndex}>{chars}</span>
  })
}

function GetStarted({ size, place, label = 'get started' }) {
  const handleClick = () => {
    trackCtaClick('get_started_click', { location: place, destination: 'get_started' })
  }

  return (
    <Cta size={size} inverse className={`site-cta site-cta--${place}`} href="/get-started" onClick={handleClick}>
      {label}
    </Cta>
  )
}

const REASONS = ['it knows your closet', 'it answers in a minute', 'it tells you why']

const PANEL_COUNT = 3

export default function Home() {
  const [scrollerRef, active] = usePinnedPanels(PANEL_COUNT, 0.05, 0.35)
  const [closerRef, closerShown] = useRevealOnScroll(0.2)
  const [typedChars, setTypedChars] = useState(1)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTypedChars((current) => {
        const next = Math.min(current + 1, TYPED_CHARS)
        if (next === TYPED_CHARS) window.clearInterval(interval)
        return next
      })
    }, TYPE_STEP)
    return () => window.clearInterval(interval)
  }, [])

  const typingComplete = typedChars === TYPED_CHARS

  // Hide later panels until pinning is measured; the non-pinned CSS overrides
  // these states so mobile and reduced-motion layouts still show every panel.
  const panelClass = (index) => {
    if (active === null) return index === 0 ? 'home-panel is-active' : 'home-panel is-next'
    if (index === active) return 'home-panel is-active'
    return `home-panel ${index < active ? 'is-past' : 'is-next'}`
  }

  return (
    <div className="home-page">
      <div className="home-grid">
        <div className="home-scroller" ref={scrollerRef}>
          <div className="home-stage">
            <section className={panelClass(0)}>
              <h1 className={`home-h1${typingComplete ? ' is-typed' : ''}`}>
                <TypedHeadline typedChars={typedChars} />
              </h1>

              <div className="home-enter" style={{ animationDelay: `${TYPING_ENDS + AFTER_TYPING}ms` }}>
                <GetStarted size="hero" place="hero" label="start the conversation" />
              </div>

              <p className="home-proof home-enter" style={{ animationDelay: `${TYPING_ENDS + AFTER_TYPING + 140}ms` }}>
                join <span>{USER_COUNT}+ people</span> getting styled by oro.
              </p>
            </section>

            <section className={panelClass(1)}>
              <h2 className="home-h2 home-h2--panel">dressed right,<br />every time it counts.</h2>
              <p className="home-body">
                nobody teaches you how to dress, so you dread the moments where it suddenly matters:
                the first date, the interview, the meeting that could change everything.
              </p>
              <p className="home-pull">oro makes sure you never show up wrong.</p>
            </section>

            <section className={panelClass(2)}>
              <h2 className="home-h2 home-h2--panel">it&rsquo;s not guessing,<br />it knows you.</h2>
              <div className="home-reasons">
                {REASONS.map((reason) => (
                  <div className="home-reason" key={reason}>
                    <span className="home-tick" aria-hidden="true">✓</span>
                    <p>{reason}</p>
                  </div>
                ))}
                <p className="home-reason-note">it gets more personal every time</p>
              </div>
            </section>
          </div>
        </div>

        <div className="home-phone-column">
          <div
            className="home-phone-sticky home-enter"
            style={{ animationDelay: `${TYPING_ENDS + AFTER_TYPING}ms` }}
          >
            <MessageThread startDelay={TYPING_ENDS + AFTER_TYPING + 780} />
          </div>
        </div>
      </div>

      <section className={`home-closer home-reveal${closerShown ? ' is-revealed' : ''}`} ref={closerRef}>
        <h2 className="home-h2 home-h2--closer">whatever the day is, you&rsquo;re dressed for it.</h2>
        <GetStarted size="statement" place="closer" />
      </section>
    </div>
  )
}
