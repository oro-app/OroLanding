import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { getNewsletterBySlug } from '../../lib/newsletters'
import NewsletterRecommendations from './NewsletterRecommendations'
import { HomeCta } from '../home/HomeChrome'
import WaitlistModal from '../overlays/WaitlistModal'
import { hasAnalyticsConsent, trackEvent } from '../../lib/analytics'
import {
  hasSeenNewsletterSignupThisSession,
  hasSignedUpForNewsletter,
  markNewsletterSignupSeenThisSession,
} from '../../lib/newsletterSignup'
import './NewsletterPage.css'

// MDX <a> override — anything that navigates off the current article (absolute
// http(s) URL, mailto/tel, or an in-app route to a different page like /...)
// opens in a new tab. Pure same-page hash anchors (#...) stay in place so
// table-of-contents-style links still scroll instead of leaving the article.
function MdxLink({ href = '', children, ...rest }) {
  const opensNewTab =
    /^(https?:)?\/\//i.test(href) ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('/')
  return (
    <a
      href={href}
      {...(opensNewTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

function MdxImage(props) {
  return <img loading="lazy" decoding="async" {...props} />
}

const MDX_COMPONENTS = {
  a: MdxLink,
  img: MdxImage,
  h2: (props) => <Heading as="h2" variant="section" {...props} />,
  h3: (props) => <Heading as="h3" variant="card" {...props} />,
}

export default function NewsletterPage({ slug }) {
  const newsletter = getNewsletterBySlug(slug)
  const articleRef = useRef(null)
  const readThresholdsRef = useRef(new Set())
  const [newsletterSignupOpen, setNewsletterSignupOpen] = useState(false)

  useEffect(() => {
    if (!newsletter) return

    trackEvent('newsletter_open', {
      newsletter_slug: newsletter.slug,
      newsletter_title: newsletter.title,
      newsletter_date: newsletter.date,
    })
  }, [newsletter])

  useEffect(() => {
    if (!newsletter) return

    readThresholdsRef.current = new Set()
    const thresholds = [25, 50, 75, 100]

    const trackReadProgress = () => {
      const article = articleRef.current
      if (!article) return

      const rect = article.getBoundingClientRect()
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight
      const readableHeight = Math.max(1, article.scrollHeight - viewportHeight)
      const pixelsRead = Math.min(Math.max(-rect.top, 0), readableHeight)
      const percentRead = article.scrollHeight <= viewportHeight
        ? 100
        : Math.round((pixelsRead / readableHeight) * 100)

      thresholds.forEach((threshold) => {
        if (percentRead < threshold || readThresholdsRef.current.has(threshold)) return
        if (!hasAnalyticsConsent()) return

        readThresholdsRef.current.add(threshold)
        trackEvent('percent_read', {
          percent_read: threshold,
          newsletter_slug: newsletter.slug,
          newsletter_title: newsletter.title,
        })
      })
    }

    trackReadProgress()
    window.addEventListener('scroll', trackReadProgress, { passive: true })
    window.addEventListener('resize', trackReadProgress)

    return () => {
      window.removeEventListener('scroll', trackReadProgress)
      window.removeEventListener('resize', trackReadProgress)
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
      <div className="newsletter-page">
        <section className="newsletter-not-found">
          <Text variant="label" muted>From the closet</Text>
          <Heading as="h1" variant="title">We could not find that note.</Heading>
          <a className="newsletter-back-link" href="/from-the-closet">
            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M14 9H4M9 4L4 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to all notes
          </a>
        </section>
      </div>
    )
  }

  const Article = newsletter.Component

  return (
    <div className="newsletter-page">
      <div className="newsletter-page-shell">
        <a className="newsletter-back-link" href="/from-the-closet">
          <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M14 9H4M9 4L4 9l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All notes
        </a>

        <article className="newsletter-article" ref={articleRef}>
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
            <Heading as="h1" variant="display">{newsletter.title}</Heading>
            {newsletter.summary && (
              <Text muted className="newsletter-article-summary">{newsletter.summary}</Text>
            )}
          </header>

          {newsletter.image && (
            <figure className="newsletter-article-figure">
              <img
                className="newsletter-article-image"
                src={newsletter.image}
                alt=""
                fetchpriority="high"
                decoding="async"
              />
            </figure>
          )}

          <div className="newsletter-article-grid">
            <div className="newsletter-article-body">
              <div className="newsletter-mdx">
                <Article components={MDX_COMPONENTS} />
              </div>
            </div>

            <NewsletterRecommendations currentSlug={newsletter.slug} />
          </div>

          <div className="newsletter-article-cta">
            <Text variant="label" muted>Meet Oro</Text>
            <Heading variant="section">Your AI stylist, <em>in your corner.</em></Heading>
            <HomeCta place="newsletter_article">Start the conversation</HomeCta>
          </div>
        </article>
      </div>

      {newsletterSignupOpen && <WaitlistModal onClose={() => setNewsletterSignupOpen(false)} />}
    </div>
  )
}
