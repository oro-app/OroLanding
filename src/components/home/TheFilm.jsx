import FilmPoster from './FilmPoster'

// The film — a SHARED section (single component; theme-aware colour, same
// layout in both themes). Faithful to the handoff's sections/the-film.jsx.
//
// The launch film is intentionally NOT committed (19 MB — kept out of git
// history). Production reads VITE_FILM_URL (point it at Vercel Blob / a CDN);
// local dev falls back to /film/launch.mp4, which exists on disk but is
// gitignored. The 88 KB poster is committed so the section looks right even
// before the video URL is set.
const FILM_SRC = import.meta.env.VITE_FILM_URL || '/film/launch.mp4'

export default function TheFilm() {
  return (
    <section id="film" className="film">
      <div className="film-inner">
        <h2 className="film-title">
          when did getting dressed get so <span className="film-em">hard?</span>
        </h2>
        <FilmPoster
          ratio="16/9"
          tone="dark"
          size="lg"
          showMeta={false}
          src={FILM_SRC}
          poster="/film/poster.jpg"
        />
        <p className="film-sub">a forty-nine-second film. press play.</p>
      </div>
    </section>
  )
}
