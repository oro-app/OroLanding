import { ORO_PHOTOS } from '../../lib/placeholderPhotos'
import './OroPhone.css'

// Real-app phone mockup — ported from the /try-oro handoff's phones.jsx, which
// itself is a port of oro v1.2.0's mobile wireframes (02-home editorial-deep +
// 03-fit-generation v4 editorial). Two screens (home + styleme), rendered at
// native 390x844 inside the wrapper and scaled by transform: scale() to the
// caller's `width`. Lives in src/components/marketing so it can be reused on
// the press kit and (eventually) on the home hero too.

const NATIVE_W = 390
const NATIVE_H = 844

/* ── iOS chrome ─────────────────────────────────────────────────────────── */

function StatusBar() {
  return (
    <div className="op-status">
      <span>9:41</span>
      <div className="op-status-right">
        <svg width="18" height="11" viewBox="0 0 19 12" aria-hidden="true">
          <rect x="0"    y="7.5" width="3.2" height="4.5" rx="0.7" fill="currentColor" />
          <rect x="4.8"  y="5"   width="3.2" height="7"   rx="0.7" fill="currentColor" />
          <rect x="9.6"  y="2.5" width="3.2" height="9.5" rx="0.7" fill="currentColor" />
          <rect x="14.4" y="0"   width="3.2" height="12"  rx="0.7" fill="currentColor" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 27 13" aria-hidden="true">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" strokeOpacity="0.4" fill="none" />
          <rect x="2"   y="2"   width="20" height="9"  rx="2"   fill="currentColor" />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill="currentColor" fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  )
}

function DynamicIsland() { return <div className="op-island" aria-hidden="true" /> }
function HomeIndicator() { return <div className="op-home-indicator" aria-hidden="true" /> }

/* ── Icons (matching v1.2.0 mobile) ─────────────────────────────────────── */

const Icon = {
  home: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  ),
  shirt: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3l3 2.2L15 3l5 4-2 4-3-1v11H9V10L6 11 4 7z" />
    </svg>
  ),
  star: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.7 6 6.3.6-4.8 4.2 1.5 6.2L12 16.8 6.3 20l1.5-6.2L3 9.6 9.3 9z" />
    </svg>
  ),
  user: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4.5 5-7 8-7s6.5 2.5 8 7" />
    </svg>
  ),
  arrowRight: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  ),
  chevDown: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  back: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  plus: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  minus: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  ),
}

/* ── Tab bar (matches v1.2.0 MinimalTabBar) ─────────────────────────────── */

function TabBar() {
  return (
    <div className="op-tabbar">
      <div className="op-tab is-active"><Icon.home size={22} /></div>
      <div className="op-tab"><Icon.shirt size={22} /></div>
      <div className="op-tab"><Icon.star size={22} /></div>
      <div className="op-tab"><Icon.user size={22} /></div>
    </div>
  )
}

/* ── HOME screen — post-onboarding editorial-deep ───────────────────────── */

function ScreenHome() {
  return (
    <div className="op-screen">
      <StatusBar />
      <DynamicIsland />

      <div className="op-home-body">
        <div className="op-daterow">
          <span className="op-date">tuesday, may 12</span>
          <div
            className="op-avatar"
            style={{ backgroundImage: `url(${ORO_PHOTOS.detail})` }}
            aria-hidden="true"
          />
        </div>

        <div className="op-greeting">
          <h1 className="op-greeting-title">
            good<br />
            <span className="op-em">morning</span>, alex.
          </h1>
        </div>

        <div
          className="op-hero-photo"
          style={{ backgroundImage: `url(${ORO_PHOTOS.hero5})` }}
          aria-hidden="true"
        />
        <div className="op-hero-cap">yesterday</div>

        <div className="op-styleme">
          <span>style me.</span>
          <Icon.arrowRight size={18} />
        </div>

        <div className="op-logfit">
          log today&apos;s fit
          <Icon.arrowRight size={13} />
        </div>

        <div className="op-stats">
          <div className="op-stat"><div className="op-stat-value">47</div><div className="op-stat-label">in closet</div></div>
          <div className="op-stat"><div className="op-stat-value">12</div><div className="op-stat-label">fits logged</div></div>
          <div className="op-stat"><div className="op-stat-value">8</div><div className="op-stat-label">fits made</div></div>
        </div>
      </div>

      <TabBar />
      <HomeIndicator />
    </div>
  )
}

/* ── STYLE ME input — editorial v4 ──────────────────────────────────────── */

function ScreenStyleMe() {
  return (
    <div className="op-screen">
      <StatusBar />
      <DynamicIsland />

      <div className="op-nav">
        <Icon.back size={22} />
        <span className="op-nav-cancel">cancel</span>
      </div>

      <div className="op-styleme-body">
        <div className="op-eyebrow">let&apos;s get you styled</div>
        <h1 className="op-styleme-title">
          tell me<br />
          <span className="op-em">two things</span>.
        </h1>
      </div>

      <div className="op-field">
        <div className="op-field-label">where are you going?</div>
        <div className="op-field-row">
          <span className="op-field-value">work</span>
          <Icon.chevDown size={20} />
        </div>
      </div>

      <div className="op-stepper">
        <div className="op-field-label">how many looks?</div>
        <div className="op-stepper-row">
          <span className="op-stepper-value">2</span>
          <div className="op-stepper-controls">
            <div className="op-stepper-btn"><Icon.minus size={16} /></div>
            <div className="op-stepper-btn op-stepper-btn--filled"><Icon.plus size={16} /></div>
          </div>
        </div>
        <div className="op-stepper-hint">maximum three.</div>
      </div>

      <div className="op-styleme-cta">
        <span>style me.</span>
        <Icon.arrowRight size={18} />
      </div>

      <HomeIndicator />
    </div>
  )
}

/* ── Phone bezel ─────────────────────────────────────────────────────────
   `imageSrc`, if provided, overrides `screen` and renders an <img> as the
   screen content (used to drop real app screenshots into the bezel without
   rebuilding them as React). Otherwise renders one of the programmatic
   screens (home / styleme). */

export function OroPhone({ screen = 'home', imageSrc = null, imageAlt = '', width = 320, rotate = 0 }) {
  const scale = width / NATIVE_W
  const Screen = screen === 'styleme' ? ScreenStyleMe : ScreenHome
  return (
    <div
      className="op-bezel"
      style={{
        '--op-scale': scale,
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <div className="op-screen-clip">
        {imageSrc ? (
          <img className="op-screen-image" src={imageSrc} alt={imageAlt} draggable={false} />
        ) : (
          <div className="op-screen-scale">
            <Screen />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── The /try-oro hero composition: back styleme + front home ──────────── */

export function OroPhonePair() {
  return (
    <div className="op-pair">
      <div className="op-pair-back">
        <OroPhone screen="styleme" width={252} rotate={-4.5} />
      </div>
      <div className="op-pair-front">
        <OroPhone screen="home" width={296} rotate={3} />
      </div>
    </div>
  )
}

export default OroPhone
