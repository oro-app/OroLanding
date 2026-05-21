import FilmPoster from './FilmPoster'

// The film — a SHARED section (single component; theme-aware colour, same
// layout in both themes). Faithful to the handoff's sections/the-film.jsx.
//
// The launch film is hosted on YouTube (no self-hosting / git binary / env).
// Set FILM_YOUTUBE_ID to the real video id (the part after `v=` or
// youtu.be/<id>). The committed 88 KB poster.jpg is the thumbnail until then;
// the play button is inert while the id is the placeholder.
//
// https://youtu.be/XI7XrQElqE0
const FILM_YOUTUBE_ID = 'XI7XrQElqE0'

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
          youtubeId={FILM_YOUTUBE_ID || null}
          poster="/film/poster.jpg"
        />
        <p className="film-sub">a forty-nine-second film. press play.</p>
      </div>
    </section>
  )
}
