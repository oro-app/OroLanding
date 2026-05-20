import { ORO_PHOTOS } from '../../lib/placeholderPhotos'
import monPhoto from '../../assets/fits/mon.jpg'
import tuePhoto from '../../assets/fits/tue.jpg'
import wedPhoto from '../../assets/fits/wed.jpg'
import thuPhoto from '../../assets/fits/thu.jpg'

// Fits by oro — faithful to the handoff (sections/fits-by-oro.jsx +
// sections/dark/fits-by-oro.jsx). Light: staggered photo wall, gradient
// overlays, day/tag/index labels, a two-col header + "see more fits" + a
// footer quip. Dark: even grid, no stagger/overlay, day caption below the
// image, different headline, no footer.

const DAYS_LIGHT = [
  { day: 'mon', tag: 'studio',  photo: ORO_PHOTOS.hero },
  { day: 'tue', tag: 'office',  photo: ORO_PHOTOS.hero2 },
  { day: 'wed', tag: 'dinner',  photo: ORO_PHOTOS.hero3 },
  { day: 'thu', tag: 'meeting', photo: ORO_PHOTOS.hero4 },
  { day: 'fri', tag: 'drinks',  photo: ORO_PHOTOS.hero5 },
]

const DAYS_DARK = [
  { day: 'mon', photo: monPhoto },
  { day: 'tue', photo: tuePhoto },
  { day: 'wed', photo: wedPhoto },
  { day: 'thu', photo: thuPhoto },
  { day: 'fri', photo: ORO_PHOTOS.hero5 },
]

function FitsByOroLight() {
  return (
    <section id="fits" className="fits fits--light">
      <div className="fits-l-head">
        <h2 className="fits-l-title">
          fits,<br />
          <span className="fits-accent">by oro</span>.
        </h2>
        <div className="fits-l-intro">
          <p>a week of outfits oro picked from real closets. nothing here was bought — only re-arranged.</p>
          <a className="fits-l-more" href="#more-fits">
            see more fits
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
      <div className="fits-l-grid">
        {DAYS_LIGHT.map((d, i) => (
          <div
            key={d.day}
            className={`fits-l-card${i % 2 === 0 ? '' : ' is-offset'}`}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(14,11,7,0.05) 0%, rgba(14,11,7,0.4) 100%), url(${d.photo})`,
            }}
          >
            <div className="fits-l-day">{d.day}</div>
            <div className="fits-l-meta">
              <span>{d.tag}</span>
              <span className="fits-l-idx">{String(i + 1).padStart(2, '0')}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="fits-l-foot">
        <span>five days · five outfits · zero spirals</span>
        <span className="fits-l-quip">and weekends? — you’re on your own.</span>
      </div>
    </section>
  )
}

function FitsByOroDark() {
  return (
    <section id="fits" className="fits fits--dark">
      <div className="fits-d-intro">
        <h2 className="fits-d-title">
          a week, <span className="fits-em">edited</span>.
        </h2>
        <p className="fits-d-lead">
          five outfits oro picked from real closets. all from clothes they already owned.
        </p>
      </div>
      <div className="fits-d-grid">
        {DAYS_DARK.map((d) => (
          <div className="fits-d-card" key={d.day}>
            <div className="fits-d-photo" style={{ backgroundImage: `url(${d.photo})` }} />
            <div className="fits-d-day">{d.day}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function FitsByOro() {
  // Light === dark on the home page: always render the dark variant.
  return <FitsByOroDark />
}
