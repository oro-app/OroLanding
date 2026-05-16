import { useEffect, useState } from 'react'
import { getNewsletterBySlug } from '../../lib/newsletters'
import NewsletterRecommendations from './NewsletterRecommendations'
import SiteFooter from '../layout/SiteFooter'
import WaitlistModal from '../overlays/WaitlistModal'
import { trackEvent } from '../../lib/analytics'
import { APP_STORE_URL } from '../../lib/links'
import {
  hasSeenNewsletterSignupThisSession,
  hasSignedUpForNewsletter,
  markNewsletterSignupSeenThisSession,
} from '../../lib/newsletterSignup'
import './NewsletterPage.css'

export default function NewsletterPage({ slug }) {
  const newsletter = getNewsletterBySlug(slug)
  const [newsletterSignupOpen, setNewsletterSignupOpen] = useState(false)

  useEffect(() => {
    const previousTitle = document.title
    document.title = newsletter ? `${newsletter.title} - Oro` : 'Newsletter - Oro'

    return () => {
      document.title = previousTitle
    }
  }, [newsletter])

  useEffect(() => {
    if (!newsletter) return
    if (hasSignedUpForNewsletter()) return
    if (hasSeenNewsletterSignupThisSession()) return

    markNewsletterSignupSeenThisSession()
    setNewsletterSignupOpen(true)
  }, [newsletter])

  if (!newsletter) {
    return (
      <main className="newsletter-page">
        <section className="newsletter-not-found">
          <p className="newsletter-page-eyebrow">Newsletter</p>
          <h1>We could not find that note.</h1>
          <a className="newsletter-back-link" href="/#newsletter">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M14 9H4M9 4L4 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to all notes
          </a>
        </section>
        <SiteFooter />
      </main>
    )
  }

  const Article = newsletter.Component

  return (
    <main className="newsletter-page">
      <div className="newsletter-page-shell">
        <a className="newsletter-back-link" href="/#newsletter">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M14 9H4M9 4L4 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All notes
        </a>

        <article className="newsletter-article">
          <header className="newsletter-article-header">
            <div className="newsletter-article-meta">
              <span className="newsletter-page-tag">{newsletter.tag}</span>
              {newsletter.dateLabel && (
                <>
                  <span aria-hidden="true" className="newsletter-article-meta-dot">·</span>
                  <time className="newsletter-page-date" dateTime={newsletter.date}>
                    {newsletter.dateLabel}
                  </time>
                </>
              )}
            </div>
            <h1>{newsletter.title}</h1>
            {newsletter.summary && (
              <p className="newsletter-article-summary">{newsletter.summary}</p>
            )}
          </header>

          {newsletter.image && (
            <figure className="newsletter-article-figure">
              <img className="newsletter-article-image" src={newsletter.image} alt="" />
            </figure>
          )}

          <div className="newsletter-article-grid">
            <div className="newsletter-article-body">
              <div className="newsletter-mdx">
                <Article />
              </div>
            </div>

            <NewsletterRecommendations currentSlug={newsletter.slug} />
          </div>

          <div className="newsletter-article-cta">
            <p className="newsletter-article-cta-eyebrow">Try Oro</p>
            <p className="newsletter-article-cta-text">
              Download Oro and start creating outfits from your style with your clothes.
            </p>
            <a
              className="newsletter-article-cta-button"
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent('cta_click', { location: 'newsletter_article', slug: newsletter.slug, destination: 'app_store' })
              }}
            >
              Download on the App Store
            </a>
          </div>
        </article>
      </div>

      <SiteFooter />

      {newsletterSignupOpen && <WaitlistModal onClose={() => setNewsletterSignupOpen(false)} />}
    </main>
  )
}
