import { ORO_PHOTOS } from '../../lib/placeholderPhotos'

// Faithful port of the design handoff's `shared.jsx` → FakePhone (+ the three
// interior screens). The phone is a fixed product mockup — its interior is always
// the light app UI regardless of the site's dark/light theme, so it uses the raw
// --oro-* palette tokens, not the theme-aware --color-* tokens.
//
// Interior text sizes are tuned for width 200 and scale linearly via `s`. This
// width-driven scaling can't be expressed cleanly in static CSS, so the styles
// stay inline (computed) — the same approach as the prototype.
const SERIF = 'var(--font-serif)'
const SANS = 'var(--font-sans)'
const INK = 'var(--oro-ink)'
const CREAM = 'var(--oro-cream)'
const PLUM = 'var(--oro-plum-deep)'
const FAINT = 'var(--oro-faint)'
const FAINT_LINE = 'var(--oro-faint-line)'

function PhoneHome({ s }) {
  return (
    <div style={{ padding: `${14 * s}px ${14 * s}px ${20 * s}px`, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 * s }}>
      <div>
        <div style={{ fontFamily: SERIF, fontSize: 22 * s, fontWeight: 400, letterSpacing: -0.6 * s, lineHeight: 1.05 }}>
          good <span style={{ fontStyle: 'italic', color: PLUM }}>morning</span>,<br />alex.
        </div>
        <div style={{ marginTop: 6 * s, fontSize: 8 * s, color: FAINT, letterSpacing: 1.2, fontWeight: 500 }}>
          tuesday · 60°f · cloudy
        </div>
      </div>
      <div>
        <div
          style={{
            aspectRatio: '4/5',
            borderRadius: 10 * s,
            overflow: 'hidden',
            background: `linear-gradient(180deg, rgba(14,11,7,0.08), rgba(14,11,7,0.25)), url(${ORO_PHOTOS.fit}) center/cover`,
            backgroundBlendMode: 'multiply',
          }}
        />
        <div style={{ marginTop: 6 * s, fontSize: 7.5 * s, color: FAINT, letterSpacing: 1.2, fontWeight: 500 }}>
          yesterday
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 * s }}>
        <button
          type="button"
          style={{
            width: '100%', padding: `${10 * s}px`,
            background: PLUM, color: CREAM, border: 'none',
            fontFamily: SERIF, fontStyle: 'italic', fontSize: 13 * s, cursor: 'pointer',
          }}
        >
          style me. →
        </button>
        <button
          type="button"
          style={{
            width: '100%', padding: `${5 * s}px`, background: 'transparent', border: 'none',
            fontFamily: SANS, fontSize: 9.5 * s, fontWeight: 500, color: INK, cursor: 'pointer',
          }}
        >
          log today&apos;s fit
        </button>
      </div>
    </div>
  )
}

function PhoneStyleMe({ s }) {
  return (
    <div style={{ padding: `${20 * s}px ${14 * s}px`, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontFamily: SERIF, fontSize: 20 * s, fontWeight: 400, letterSpacing: -0.5 * s, lineHeight: 1.1 }}>
        tell me <span style={{ fontStyle: 'italic', color: PLUM }}>two things</span>.
      </div>
      <div style={{ marginTop: 22 * s, paddingBottom: 4 * s, borderBottom: `1px solid ${FAINT_LINE}` }}>
        <div style={{ fontSize: 7.5 * s, color: FAINT, letterSpacing: 1.4, fontWeight: 600 }}>WHERE</div>
        <div style={{ marginTop: 3 * s, fontFamily: SERIF, fontStyle: 'italic', fontSize: 15 * s, color: INK }}>office</div>
      </div>
      <div style={{ marginTop: 16 * s, paddingBottom: 4 * s, borderBottom: `1px solid ${FAINT_LINE}` }}>
        <div style={{ fontSize: 7.5 * s, color: FAINT, letterSpacing: 1.4, fontWeight: 600 }}>HOW I FEEL</div>
        <div style={{ marginTop: 3 * s, fontFamily: SERIF, fontStyle: 'italic', fontSize: 15 * s, color: INK }}>quiet but sharp</div>
      </div>
      <button
        type="button"
        style={{
          marginTop: 'auto', width: '100%', padding: `${10 * s}px`,
          background: PLUM, color: CREAM, border: 'none',
          fontFamily: SERIF, fontStyle: 'italic', fontSize: 13 * s, cursor: 'pointer',
        }}
      >
        style me. →
      </button>
    </div>
  )
}

function PhoneStyled({ s }) {
  return (
    <div style={{ padding: `${14 * s}px ${14 * s}px ${16 * s}px`, flex: 1, display: 'flex', flexDirection: 'column', gap: 10 * s }}>
      <div style={{ fontFamily: SERIF, fontSize: 15 * s, fontWeight: 400, letterSpacing: -0.4 * s, lineHeight: 1.15 }}>
        your <span style={{ fontStyle: 'italic', color: PLUM }}>fit</span>.
      </div>
      <div
        style={{
          flex: 1, borderRadius: 10 * s, overflow: 'hidden',
          background: `linear-gradient(180deg, rgba(14,11,7,0.05), rgba(14,11,7,0.18)), url(${ORO_PHOTOS.hero}) center/cover`,
          backgroundBlendMode: 'multiply',
        }}
      />
      <div style={{ fontSize: 8 * s, color: FAINT, letterSpacing: 1.2, fontWeight: 500 }}>
        cream knit · charcoal trouser · loafer
      </div>
    </div>
  )
}

export default function FakePhone({ width = 200, screen = 'home', children, shadow = true }) {
  const h = Math.round(width * (812 / 375))
  const bezel = Math.max(6, Math.round(width * 0.025))
  const s = width / 200

  let interior = children
  if (!interior) {
    if (screen === 'styled') interior = <PhoneStyled s={s} />
    else if (screen === 'styleme') interior = <PhoneStyleMe s={s} />
    else interior = <PhoneHome s={s} />
  }

  return (
    <div
      style={{
        width,
        height: h,
        background: INK,
        borderRadius: width * 0.13,
        padding: bezel,
        boxShadow: shadow
          ? '0 24px 60px -20px rgba(14,11,7,0.35), 0 6px 16px -8px rgba(14,11,7,0.25)'
          : 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: CREAM,
          borderRadius: width * 0.1,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: SANS,
        }}
      >
        <div
          style={{
            padding: `${10 * s}px ${14 * s}px ${6 * s}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 9 * s,
            fontWeight: 600,
            color: INK,
          }}
        >
          <span>9:41</span>
          <span style={{ width: 10 * s, height: 5 * s, border: `1px solid ${INK}`, borderRadius: 1.5, opacity: 0.6 }} />
        </div>
        {interior}
      </div>
    </div>
  )
}
