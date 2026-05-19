import { useTheme } from '../../context/ThemeContext'
import { ORO_PHOTOS } from '../../lib/placeholderPhotos'

// Why oro — faithful to the handoff (sections/why-oro.jsx +
// sections/dark/why-oro.jsx). Light and dark are structurally different:
// light has an eyebrow, a different headline, a 3-item bulleted list and a
// captioned photo; dark is just a big headline + one paragraph + photo.

const ITEMS = [
  { title: 'your closet, your fits.',    desc: 'picks from what you already own.' },
  { title: 'two questions, not twenty.', desc: 'where, how you feel. no quizzes.' },
  { title: 'editor, not algorithm.',     desc: 'learns what you wear, quietly.' },
]

function WhyOroLight() {
  return (
    <section id="whyoro" className="why why--light">
      <div className="why-l-grid">
        <div className="why-l-copy">
          <div className="why-l-eyebrow">why oro</div>
          <h2 className="why-l-title">
            an <span className="why-accent">editor</span>,<br />not an algorithm.
          </h2>
          <p className="why-l-lead">
            most ai stylists recommend new clothes. oro recommends{' '}
            <em className="why-em">your</em> clothes — the ones you already love,
            in combinations you wouldn’t have tried.
          </p>
          <div className="why-l-list">
            {ITEMS.map((d) => (
              <div className="why-l-item" key={d.title}>
                <span className="why-l-dot" aria-hidden="true">·</span>
                <div className="why-l-itemtitle">{d.title}</div>
                <div className="why-l-itemdesc">{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="why-l-media">
          <div className="why-l-photo" style={{ backgroundImage: `url(${ORO_PHOTOS.detail})` }}>
            <div className="why-l-caption">the same camel coat. a different idea.</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhyOroDark() {
  return (
    <section id="whyoro" className="why why--dark">
      <div className="why-d-grid">
        <div className="why-d-copy">
          <h2 className="why-d-title">
            a stylist<br />of <span className="why-em-d">one</span>.
          </h2>
          <p className="why-d-lead">
            oro learns your closet, your week, the way you actually live.
            every outfit is built around <em className="why-em-d">you</em> —
            your taste, your day, who you’re becoming — not a million strangers
            in a feed.
          </p>
        </div>
        <div className="why-d-photo" style={{ backgroundImage: `url(${ORO_PHOTOS.detail})` }} />
      </div>
    </section>
  )
}

export default function WhyOro() {
  const { theme } = useTheme()
  return theme === 'dark' ? <WhyOroDark /> : <WhyOroLight />
}
