import { Cta } from '@oro/web'
import { trackCtaClick } from '../../lib/analytics'
import { USER_COUNT } from '../../lib/stats'
import { useRevealOnScroll } from '../../lib/useRevealOnScroll'
import MessageThread from './MessageThread'

// Entrance choreography, in ms. The headline types itself, then the rest of the
// hero arrives in the order you read it; everything below the fold waits for
// the scroll instead.
const TYPE_STEP = 34
const HEADLINE = [
  { text: 'the #1 ai stylist you can ' },
  { text: 'text', accent: true },
]
const TYPED_CHARS = HEADLINE.reduce((n, part) => n + part.text.length, 0)
const TYPING_ENDS = TYPED_CHARS * TYPE_STEP

// Each character carries its own delay, so the reveal is CSS-driven and the
// whole headline still sits in the prerendered HTML for crawlers.
function TypedHeadline() {
  let index = -1
  return HEADLINE.map((part, partIndex) => {
    const chars = [...part.text].map((char, charIndex) => {
      index += 1
      return (
        <span
          className="tw-char"
          key={`${partIndex}-${charIndex}`}
          style={{ animationDelay: `${index * TYPE_STEP}ms` }}
        >
          {char}
        </span>
      )
    })
    return part.accent ? <em key={partIndex}>{chars}</em> : <span key={partIndex}>{chars}</span>
  })
}

function GetStarted({ size, place, label = 'get started' }) {
  const go = () => {
    trackCtaClick('get_started_click', { location: place, destination: 'get_started' })
    window.location.assign('/get-started')
  }

  return (
    <Cta size={size} inverse className={`site-cta site-cta--${place}`} onClick={go}>
      {label}
    </Cta>
  )
}

const SCALES = [
  { left: 'casual', at: '52%', right: 'black tie' },
  { left: 'warm out', at: '74%', right: 'freezing' },
  { left: 'sitting all night', at: '30%', right: 'on your feet' },
  { left: 'your neutrals', at: '62%', right: 'your best colour' },
  { left: 'fitted to you', at: '38%', right: 'oversized on purpose' },
]

const REASONS = ['it knows your closet', 'it answers in a minute', 'it tells you why']

function revealClass(revealed) {
  return `home-reveal${revealed ? ' is-revealed' : ''}`
}

export default function Home() {
  const [valueRef, valueShown] = useRevealOnScroll(0.15)
  const [reasonsRef, reasonsShown] = useRevealOnScroll(0.15)
  const [scalesRef, scalesShown] = useRevealOnScroll(0.15)
  const [closerRef, closerShown] = useRevealOnScroll(0.2)

  return (
    <div className="home-page">
      <div className="home-grid">
        <div className="home-column">
          <h1 className="home-h1">
            <TypedHeadline />
          </h1>

          <div className="home-enter" style={{ animationDelay: `${TYPING_ENDS + 120}ms` }}>
            <GetStarted size="hero" place="hero" label="start the conversation" />
          </div>

          <p className="home-proof home-enter" style={{ animationDelay: `${TYPING_ENDS + 260}ms` }}>
            join <span>{USER_COUNT}+ people</span> getting styled by oro.
          </p>

          <section className={`home-block ${revealClass(valueShown)}`} ref={valueRef}>
            <h2 className="home-h2 home-h2--lead">dressed right, every time it counts.</h2>
            <p className="home-body">
              nobody teaches you how to dress, so you dread the moments where it suddenly matters -
              the first date, the interview, the meeting that could change everything.
            </p>
            <p className="home-pull">oro makes sure you never show up wrong.</p>
          </section>

          <section className="home-block">
            <div className={revealClass(reasonsShown)} ref={reasonsRef}>
              <p className="home-eyebrow">why it works</p>
              <h2 className="home-h2">it&rsquo;s not guessing. it knows you.</h2>
              <div className="home-reasons">
                {REASONS.map((reason) => (
                  <div className="home-reason" key={reason}>
                    <span className="home-tick" aria-hidden="true">✓</span>
                    <p>{reason}</p>
                  </div>
                ))}
                <p className="home-reason-note">it gets more personal every time</p>
              </div>
            </div>

            <div className={`home-scales ${revealClass(scalesShown)}`} ref={scalesRef}>
              <h2 className="home-h2 home-h2--scales">what makes an outfit work.</h2>
              {SCALES.map((scale) => (
                <div className="home-scale" key={scale.left}>
                  <span className="home-scale-anchor home-scale-anchor--left">{scale.left}</span>
                  <span className="home-scale-track">
                    <span className="home-scale-dot" style={{ left: scale.at }} />
                  </span>
                  <span className="home-scale-anchor">{scale.right}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="home-phone-column">
          <div
            className="home-phone-sticky home-enter"
            style={{ animationDelay: `${TYPING_ENDS + 400}ms` }}
          >
            <MessageThread startDelay={TYPING_ENDS + 900} />
          </div>
        </div>
      </div>

      <section className={`home-closer ${revealClass(closerShown)}`} ref={closerRef}>
        <h2 className="home-h2 home-h2--closer">whatever the day is, you&rsquo;re dressed for it.</h2>
        <GetStarted size="statement" place="closer" />
      </section>
    </div>
  )
}
