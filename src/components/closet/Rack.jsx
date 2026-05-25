import './Rack.css'

// The Rack — the centerpiece editorial gesture. Each newsletter renders as
// a hanger (S-hook + variable-length string + photo + title + excerpt +
// care-style date tag) hanging from a hairline "rod". Per-hanger variance
// (width / aspect / string length / rotation) is deterministically derived
// from the slug so every render is stable.
//
// Idle animation: gentle sway from `transform-origin: top center`. Hover:
// shorter period + wider swing. Desynchronised via nth-child durations.
// prefers-reduced-motion turns it all off.

// ── Per-card variance ──────────────────────────────────────────────────
// Deterministic, slug-seeded picks so the same card always renders the
// same way — order is stable across reloads and across the build.

function hashSlug(slug) {
  let h = 0
  for (let i = 0; i < slug.length; i++) {
    h = (h * 31 + slug.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const WIDTHS = [200, 210, 220, 240, 260, 280]
const ASPECTS = ['3 / 4', '4 / 5', '2 / 3', '3 / 5']

function variantsFor(slug) {
  const h = hashSlug(slug || '')
  const width = WIDTHS[h % WIDTHS.length]
  const aspect = ASPECTS[Math.floor(h / 11) % ASPECTS.length]
  const stringLen = 24 + (h % 66)              // 24..89 px
  const rotDeg = ((h % 49) - 24) / 10          // -2.4..+2.4 deg
  return { width, aspect, stringLen, rotDeg }
}

function SHook() {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden="true" className="rack-hook">
      <path
        d="M7 0 V8 M2 11 A5 5 0 0 1 12 11 A5 5 0 0 1 7 16 V22"
        stroke="currentColor"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Hanger({ entry }) {
  const v = variantsFor(entry.slug)
  return (
    <a
      className="rack-hanger"
      href={entry.href}
     
      rel="noopener noreferrer"
      style={{
        '--rot': `${v.rotDeg}deg`,
        '--w': `${v.width}px`,
        '--s': `${v.stringLen}px`,
        width: `${v.width}px`,
      }}
    >
      <SHook />
      <span className="rack-string" aria-hidden="true" />
      <span
        className="rack-photo"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${entry.image})`,
          aspectRatio: v.aspect,
        }}
      />
      <h3 className="rack-title">{entry.title}</h3>
      {entry.summary && <p className="rack-excerpt">{entry.summary}</p>}
      <span className="rack-tag">
        <span>{entry.dateLabel.toLowerCase()}</span>
        {entry.readTime && (
          <>
            <span className="rack-tag-dot" aria-hidden="true">·</span>
            <span>{entry.readTime}</span>
          </>
        )}
      </span>
    </a>
  )
}

// Group entries into rods of 2 or 3 each. With N entries, target 3 per rod
// unless that would leave a 1-card orphan — in which case shift to 2 + 2 + 3
// (or generally, balanced 2s and 3s).
function rodsFromEntries(entries) {
  const n = entries.length
  if (n === 0) return []
  if (n <= 3) return [entries]

  // Build a sequence of 2s and 3s that sums to n with no 1.
  // Strategy: start with all 3s, replace 3+3 with 2+2+2 as needed to absorb
  // the remainder. Simplest: if n % 3 == 1, take a 2+2 ending; if n % 3 == 2,
  // append a 2 at the end; if n % 3 == 0, all 3s.
  const rods = []
  let remaining = n
  while (remaining > 0) {
    let take = 3
    if (remaining === 4) take = 2       // 2+2 instead of 3+1
    else if (remaining === 2) take = 2  // trailing pair
    else if (remaining === 5) take = 3  // 3+2
    rods.push(entries.slice(n - remaining, n - remaining + take))
    remaining -= take
  }
  return rods
}

export default function Rack({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <section className="rack">
        <div className="rack-inner">
          <div className="rack-header">
            <h2 className="rack-title-h2">
              the <em>rack</em>.
            </h2>
            <span className="rack-sub">flip through older letters.</span>
          </div>
          <div className="rack-rod" aria-hidden="true" />
          <p className="rack-empty">the archive opens with the next letter.</p>
        </div>
      </section>
    )
  }

  const rods = rodsFromEntries(entries)

  return (
    <section className="rack">
      <div className="rack-inner">
        <div className="rack-header">
          <h2 className="rack-title-h2">
            the <em>rack</em>.
          </h2>
          <span className="rack-sub">flip through older letters.</span>
        </div>

        {rods.map((rod, ri) => (
          <div className="rack-row" key={ri}>
            <div className="rack-rod" aria-hidden="true" />
            <div className="rack-row-items">
              {rod.map((entry) => (
                <Hanger entry={entry} key={entry.slug} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
