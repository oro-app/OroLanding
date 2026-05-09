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
        <section className="newsletter-not-found">
          <p className="newsletter-page-eyebrow">Newsletter</p>
          <h1>We could not find that note.</h1>
        </section>
        <SiteFooter />
      </main>
    )
  }

  const Article = newsletter.Component

  return (
    <main className="newsletter-page">
      <article className="newsletter-article">
        <header className="newsletter-article-header">
          <div className="newsletter-article-meta">
            <span className="newsletter-page-tag">{newsletter.tag}</span>
            <time className="newsletter-page-date" dateTime={newsletter.date}>
              {newsletter.dateLabel}
            </time>
          </div>
          <h1>{newsletter.title}</h1>
          {newsletter.image && (
            <img className="newsletter-article-image" src={newsletter.image} alt="" />
          )}
          {newsletter.summary && <p>{newsletter.summary}</p>}
        </header>

        <div className="newsletter-mdx">
          <Article />
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
