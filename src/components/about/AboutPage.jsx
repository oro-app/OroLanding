import { Heading, Text } from 'oro-kit'
import AboutContent, { leadership, meta, supportingTeam } from '../../content/about.mdx'
import '../newsletter/NewsletterPage.css'
import './AboutPage.css'

function TeamCard({ member, supporting = false }) {
  return (
    <figure className={`team-card${supporting ? ' team-card--supporting' : ''}`}>
      <div className="team-card-image-wrap">
        <img
          className="team-card-image"
          src={member.image}
          alt=""
          loading="lazy"
          decoding="async"
          width="600"
          height="600"
        />
        {member.placeholder && <span className="team-card-placeholder">Portrait coming soon</span>}
      </div>
      <figcaption className="team-card-caption">
        <Heading as="h3" variant="card">{member.name}</Heading>
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

          <section className="team-section" aria-labelledby="leadership-title">
            <Heading as="h2" variant="section" id="leadership-title">Leadership</Heading>
            <div className="team-primary-grid">
              {leadership.map((member) => <TeamCard key={member.name} member={member} />)}
            </div>
          </section>

          <section className="team-section team-section--supporting" aria-labelledby="supporting-team-title">
            <Heading as="h2" variant="section" id="supporting-team-title">Supporting the work</Heading>
            <div className="team-supporting-grid">
              {supportingTeam.map((member) => <TeamCard key={member.name} member={member} supporting />)}
            </div>
          </section>
        </article>
      </div>
    </div>
  )
}
