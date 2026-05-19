import { useTheme } from '../../context/ThemeContext'
import { trackEvent } from '../../lib/analytics'
import FakePhone from './FakePhone'
// Real hero conversation photo (replaces the Unsplash placeholder). Imported
// so Vite bundles it — note /static is dev-proxied to the backend, so a
// public/static path would not resolve locally.
import heroFitPhoto from '../../assets/hero/hero-fit.jpg'

// Hero — the "conversation" hero. Single theme-aware component collapsing the
// handoff's two prototype files (hero/v4-conversation.jsx + ...-dark.jsx). The
// light and dark variants differ in layout AND copy (not just color), so this
// branches structurally on theme rather than only swapping color tokens.

function Arrow({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function LightBubble({ side = 'oro', filled = false, children }) {
  const cls = ['hero-bubble', `hero-bubble--${side}`, filled ? 'is-filled' : 'is-plain'].join(' ')
  return <div className={cls}>{children}</div>
}

function DarkBubble({ side = 'oro', emphasis = false, children }) {
  const cls = ['hero-dbubble', `hero-dbubble--${side}`, emphasis ? 'is-emphasis' : ''].join(' ')
  return <div className={cls}>{children}</div>
}

function HeroLight({ onTryOro }) {
  return (
    <section id="intro" className="hero hero--light">
      <div className="hero-l-id">
        <div className="hero-l-avatar"><span>o</span></div>
        <img src="/static/oro-logo.png" alt="oro" className="hero-l-logo" />
        <div className="hero-l-time">this morning, 7:42</div>
      </div>

      <div className="hero-l-thread">
        <LightBubble side="oro" filled>
          <span className="hero-line">morning, alex.</span>
        </LightBubble>

        <LightBubble side="oro">
          <p className="hero-l-question">
            what do you want to <span className="hero-accent">look like</span> today?
          </p>
        </LightBubble>

        <LightBubble side="you" filled>
          <span className="hero-line hero-line--you">quiet but sharp. office.</span>
        </LightBubble>

        <LightBubble side="oro" filled>
          <span className="hero-line">okay. how about this.</span>
        </LightBubble>

        <div className="hero-l-phoneblock">
          <div className="hero-l-phoneframe">
            <FakePhone width={200} screen="styled" shadow={false} />
          </div>
          <div className="hero-l-phonecap">↑ tap to wear it. or tell oro to try again.</div>
        </div>
      </div>

      <div className="hero-l-cta">
        <button type="button" className="hero-cta-primary" onClick={onTryOro}>
          start the conversation
          <Arrow size={13} />
        </button>
        <span className="hero-cta-note">free, ios — early access.</span>
      </div>
    </section>
  )
}

function HeroDark({ onTryOro }) {
  return (
    <section id="intro" className="hero hero--dark">
      <div className="hero-d-grid">
        <div className="hero-d-thread">
          <DarkBubble side="oro">
            <span className="hero-line">morning, alex.</span>
          </DarkBubble>

          <DarkBubble side="oro" emphasis>
            <p className="hero-d-question">
              what&apos;s on your <span className="hero-accent">plate</span> today?
            </p>
          </DarkBubble>

          <DarkBubble side="you">
            <span className="hero-line">coffee with jess, then thrifting downtown.</span>
          </DarkBubble>

          <DarkBubble side="oro">
            <span className="hero-line">okay. how about this.</span>
          </DarkBubble>

          <div className="hero-d-photoblock">
            <div className="hero-d-photoframe">
              <div className="hero-d-photo" style={{ backgroundImage: `url(${heroFitPhoto})` }} />
            </div>
            <div className="hero-d-photocap">↑ tap to wear it. or tell oro to try again.</div>
          </div>
        </div>

        <aside className="hero-d-rail">
          <img className="hero-d-logo" src="/static/oro-logo.png" alt="oro" />
          <h1 className="hero-d-title">make your wardrobe work for you.</h1>
          <div className="hero-d-ctacol">
            <button type="button" className="hero-cta-primary hero-cta-primary--ondark" onClick={onTryOro}>
              start the conversation
              <Arrow size={14} />
            </button>
            <span className="hero-cta-note hero-cta-note--ondark">free, ios — early access.</span>
          </div>
        </aside>
      </div>
    </section>
  )
}

export default function Hero({ onTryOro }) {
  const { theme } = useTheme()

  const handleTryOro = () => {
    trackEvent('cta_click', { location: 'hero', destination: 'waitlist' })
    onTryOro?.()
  }

  return theme === 'dark'
    ? <HeroDark onTryOro={handleTryOro} />
    : <HeroLight onTryOro={handleTryOro} />
}
