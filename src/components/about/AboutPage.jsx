import { Heading, Text } from 'oro-kit'
import AboutContent, { meta } from '../../content/about.mdx'
import '../newsletter/NewsletterPage.css'

const components = {
  h2: (props) => <Heading as="h2" variant="section" {...props} />,
  h3: (props) => <Heading as="h3" variant="card" {...props} />,
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

          <div className="newsletter-article-body">
            <div className="newsletter-mdx">
              <AboutContent components={components} />
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
