import { ORO_PHOTOS } from '../../lib/placeholderPhotos'

// Faithful port of the handoff's shared.jsx → FilmPoster. Prop-driven sizing /
// ratio / overlay stay inline (computed); static styling lives in TheFilm.css.
// The play button is visual-only here — same as the prototype (no film wired).
const PLAY_SIZE = { sm: 44, md: 60, lg: 80 }

export default function FilmPoster({
  ratio = '16/9',
  tone = 'light',
  size = 'lg',
  caption = null,
  photo = ORO_PHOTOS.hero4,
  showMeta = true,
  rounded = 0,
}) {
  const dark = tone === 'dark'
  const overlay = dark
    ? 'linear-gradient(180deg, rgba(58,38,70,0.55) 0%, rgba(58,38,70,0.85) 100%)'
    : 'linear-gradient(180deg, rgba(14,11,7,0.18) 0%, rgba(14,11,7,0.55) 100%)'
  const playSize = PLAY_SIZE[size] || PLAY_SIZE.lg

  return (
    <div
      className="film-poster"
      style={{
        aspectRatio: ratio,
        borderRadius: rounded,
        background: `${overlay}, url(${photo}) center/cover no-repeat`,
        backgroundBlendMode: 'multiply',
      }}
    >
      <button
        type="button"
        className="film-poster-play"
        aria-label="play the film"
        style={{
          width: playSize,
          height: playSize,
          borderColor: dark ? 'var(--oro-cream-45)' : 'var(--oro-cream-70)',
        }}
      >
        <svg width={playSize * 0.32} height={playSize * 0.32} viewBox="0 0 24 24" fill="var(--oro-cream)" stroke="none" aria-hidden="true">
          <path d="M7 4.5v15l13-7.5z" />
        </svg>
      </button>
      {showMeta && <div className="film-poster-meta">play the film — 0:49</div>}
      {caption && <div className="film-poster-caption">{caption}</div>}
    </div>
  )
}
