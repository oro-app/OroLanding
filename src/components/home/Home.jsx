import { Cta } from '@oro/web'
import { trackCtaClick } from '../../lib/analytics'
import { USER_COUNT } from '../../lib/stats'
import MessageThread from './MessageThread'

// Home renders its own header and footer instead of SiteHeader/SiteFooter, so
// the landing's only navigation is the CTA.
function Wordmark({ className }) {
  return (
    <span className={`home-mark ${className}`}>
      <img src="/static/oro-logo.png" alt="oro" fetchpriority="high" decoding="async" />
    </span>
  )
}

function GetStarted({ size, place }) {
  const go = () => {
    trackCtaClick('get_started_click', { location: place, destination: 'get_started' })
    window.location.assign('/get-started')
  }

  return (
    <Cta size={size} inverse className={`home-cta home-cta--${place}`} onClick={go}>
      get started
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

export default function Home() {
  return (
    <div className="home-page">
      <header className="home-header">
        <a href="/" aria-label="oro home">
          <Wordmark className="home-mark--header" />
        </a>
        <GetStarted size="compact" place="header" />
      </header>

      <div className="home-grid">
        <div className="home-column">
          <h1 className="home-h1">
            the #1 ai stylist you can <em>text</em>
          </h1>
          <GetStarted size="hero" place="hero" />
          <p className="home-proof">
            join <span>{USER_COUNT}+ people</span> getting styled by oro.
          </p>

          <section className="home-block">
            <h2 className="home-h2 home-h2--lead">dressed right, every time it counts.</h2>
            <p className="home-body">
              nobody teaches you how to dress, so you dread the moments where it suddenly matters -
              the first date, the interview, the meeting that could change everything.
            </p>
            <p className="home-pull">oro makes sure you never show up wrong.</p>
            <p className="home-body">
              tell it where you&rsquo;re going and get an outfit with a preview of yourself in it.
            </p>
          </section>

          <section className="home-block">
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

            <div className="home-scales">
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
          <div className="home-phone-sticky">
            <MessageThread />
          </div>
        </div>
      </div>

      <section className="home-closer">
        <h2 className="home-h2 home-h2--closer">whatever the day is, you&rsquo;re dressed for it.</h2>
        <GetStarted size="statement" place="closer" />
      </section>

      <footer className="home-footer">
        <a href="/" aria-label="oro home">
          <Wordmark className="home-mark--footer" />
        </a>
        <div className="home-footer-links">
          <a href="/from-the-closet">from the closet</a>
          <a href="/contact">contact</a>
          <a href="/privacy">privacy</a>
        </div>
      </footer>
    </div>
  )
}
