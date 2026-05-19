import FilmPoster from './FilmPoster'

// The film — a SHARED section (single component, always plum regardless of
// theme, like the footer). Faithful to the handoff's sections/the-film.jsx.
export default function TheFilm() {
  return (
    <section id="film" className="film">
      <div className="film-inner">
        <h2 className="film-title">
          when did getting dressed get so <span className="film-em">hard?</span>
        </h2>
        <FilmPoster ratio="16/9" tone="dark" size="lg" showMeta={false} />
        <p className="film-sub">a forty-nine-second film. press play.</p>
      </div>
    </section>
  )
}
