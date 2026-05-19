import { ORO_PHOTOS } from '../../lib/placeholderPhotos'

// Testimonials — faithful to the handoff (sections/testimonials.jsx +
// sections/dark/testimonials.jsx). Light: eyebrow + headline + 3 cards with
// a big quote-mark, top hairline, avatar, name/where. Dark: none of that —
// just three large italic quotes with a "name · where" caption.
// Avatars are still ORO_PHOTOS placeholders pending real content.

const QUOTES = [
  { quote: 'i’ve tried other style apps. oro’s the only one that actually gets my taste: my colours, what fits my body, what i keep reaching for.', name: 'alex',   where: 'brooklyn',    avatar: ORO_PHOTOS.hero2 },
  { quote: 'i own a lot of clothes but kept wearing the same ten things. oro started pulling pieces i forgot i had. felt like a new wardrobe.',     name: 'sam',    where: 'los angeles', avatar: ORO_PHOTOS.hero3 },
  { quote: 'changing in and out of outfits is exhausting. now i try everything on oro first and only put on what i’m actually wearing.',            name: 'morgan', where: 'london',      avatar: ORO_PHOTOS.hero4 },
]

function TestimonialsLight() {
  return (
    <section id="testimonials" className="tm tm--light">
      <div className="tm-l-eyebrow">the insiders</div>
      <h2 className="tm-l-title">
        what they’re <span className="tm-accent">saying</span>.
      </h2>
      <div className="tm-l-grid">
        {QUOTES.map((q) => (
          <figure className="tm-l-card" key={q.name}>
            <div className="tm-l-mark" aria-hidden="true">“</div>
            <blockquote className="tm-l-quote">{q.quote}</blockquote>
            <figcaption className="tm-l-cap">
              <div className="tm-l-avatar" style={{ backgroundImage: `url(${q.avatar})` }} />
              <div>
                <div className="tm-l-name">{q.name}</div>
                <div className="tm-l-where">{q.where}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

function TestimonialsDark() {
  return (
    <section id="testimonials" className="tm tm--dark">
      <div className="tm-d-grid">
        {QUOTES.map((q) => (
          <figure className="tm-d-card" key={q.name}>
            <blockquote className="tm-d-quote">“{q.quote}”</blockquote>
            <figcaption className="tm-d-cap">{q.name} · {q.where}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export default function Testimonials() {
  // Light === dark on the home page: always render the dark variant.
  return <TestimonialsDark />
}
