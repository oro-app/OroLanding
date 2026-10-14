import { Heading, Text } from 'oro-kit'
import AboutContent, { leadership, meta } from '../../content/about.mdx'
import '../newsletter/NewsletterPage.css'
import './AboutPage.css'

function TeamCard({ member }) {
  return (
    <figure className="team-card">
      <div className="team-card-image-wrap">
        <img
          className="team-card-image"
          src={member.image}
          style={member.imageStyle}
          alt=""
          loading="lazy"
          decoding="async"
          width="600"
          height="600"
        />
      </div>
      <figcaption className="team-card-caption">
        <Heading as="h2" variant="card">{member.name}</Heading>
        <Text muted>{member.role}</Text>
      </figcaption>
    </figure>
  )
}

export default function AboutPage() {
  return (
    <div className="newsletter-page about-page">
      <div className="newsletter-page-shell">
        <article className="newsletter-article">
          <header className="newsletter-article-header">
            <div className="newsletter-article-meta">
              <span className="newsletter-page-tag">{meta.tag}</span>
            </div>
            <Heading as="h1" variant="display">{meta.title}</Heading>
            <Text muted className="newsletter-article-summary">{meta.summary}</Text>
          </header>

          <div className="about-intro newsletter-mdx">
            <AboutContent />
          </div>

          <section className="team-section" aria-label="Leadership">
            <div className="team-primary-grid">
              {leadership.map((member) => <TeamCard key={member.name} member={member} />)}
            </div>
          </section>
        </article>
      </div>
    </div>
  )
}
