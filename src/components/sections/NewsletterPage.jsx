import { useEffect } from 'react'
import { getNewsletterBySlug } from '../../lib/newsletters'
import SiteFooter from './SiteFooter'
import './NewsletterPage.css'

export default function NewsletterPage({ slug }) {
  const newsletter = getNewsletterBySlug(slug)

  useEffect(() => {
    const previousTitle = document.title
    document.title = newsletter ? `${newsletter.title} - Oro` : 'Newsletter - Oro'

    return () => {
      document.title = previousTitle
    }
  }, [newsletter])

  if (!newsletter) {
    return (
      <main className="newsletter-page">
        <NewsletterNav />
        <section className="newsletter-not-found">
          <p className="newsletter-page-eyebrow">Newsletter</p>
          <h1>We could not find that note.</h1>
          <a href="/#newsletter" className="newsletter-back-button">Back to newsletters</a>
        </section>
        <SiteFooter />
      </main>
    )
  }

  const Article = newsletter.Component

  return (
    <main className="newsletter-page">
      <NewsletterNav />

      <article className="newsletter-article">
        <header className="newsletter-article-header">
          <a href="/#newsletter" className="newsletter-back-link">Back to newsletters</a>
          <time className="newsletter-page-date" dateTime={newsletter.date}>
            {newsletter.dateLabel}
          </time>
          <h1>{newsletter.title}</h1>
          {newsletter.summary && <p>{newsletter.summary}</p>}
        </header>

        {newsletter.image && (
          <img className="newsletter-article-image" src={newsletter.image} alt="" />
        )}

        <div className="newsletter-mdx">
          <Article />
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}

function NewsletterNav() {
  return (
    <nav className="newsletter-page-nav" aria-label="Newsletter">
      <a href="/" aria-label="Oro home">
        <img src="/static/oro-logo.png" alt="Oro" />
      </a>
    </nav>
  )
}
