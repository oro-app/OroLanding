import { useState } from 'react'
import { ORO_PHOTOS } from '../../lib/placeholderPhotos'

// Faithful port of the handoff's shared.jsx → FilmPoster. Prop-driven sizing /
// ratio / overlay stay inline (computed); static styling lives in TheFilm.css.
// Pass `src` to enable click-to-play with the real video file.
const PLAY_SIZE = { sm: 44, md: 60, lg: 80 }

export default function FilmPoster({
  ratio = '16/9',
  tone = 'light',
  size = 'lg',
  caption = null,
  photo = ORO_PHOTOS.hero4,
  showMeta = true,
  rounded = 0,
  src = null,
  poster = null,
}) {
  const [playing, setPlaying] = useState(false)
  const dark = tone === 'dark'
  const overlay = dark
    ? 'linear-gradient(180deg, rgba(58,38,70,0.55) 0%, rgba(58,38,70,0.85) 100%)'
    : 'linear-gradient(180deg, rgba(14,11,7,0.18) 0%, rgba(14,11,7,0.55) 100%)'
  const playSize = PLAY_SIZE[size] || PLAY_SIZE.lg

  if (playing && src) {
    return (
      <div
        className="film-poster"
        style={{ aspectRatio: ratio, borderRadius: rounded, background: '#000' }}
      >
        <video
          src={src}
          poster={poster}
          autoPlay
          controls
          preload="metadata"
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
        />
      </div>
    )
  }

  return (
    <div
      className="film-poster"
      style={{
        aspectRatio: ratio,
        borderRadius: rounded,
        background: poster
          ? `${overlay}, url(${poster}) center/cover no-repeat`
          : `${overlay}, url(${photo}) center/cover no-repeat`,
        backgroundBlendMode: 'multiply',
        cursor: src ? 'pointer' : 'default',
      }}
      onClick={src ? () => setPlaying(true) : undefined}
    >
      <button
        type="button"
        className="film-poster-play"
        aria-label="play the film"
        onClick={src ? () => setPlaying(true) : undefined}
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
