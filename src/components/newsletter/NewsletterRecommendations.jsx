import { newsletters } from '../../lib/newsletters'
import './NewsletterRecommendations.css'

const MAX_RECOMMENDATIONS = 3

export default function NewsletterRecommendations({ currentSlug }) {
  const recommendations = newsletters
    .filter((newsletter) => newsletter.slug !== currentSlug)
    .slice(0, MAX_RECOMMENDATIONS)

  if (recommendations.length === 0) return null

  return (
    <aside className="newsletter-recs" aria-label="More newsletters">
      <div className="newsletter-recs-header">
        <span className="newsletter-recs-eyebrow">Keep reading</span>
        <h2 className="newsletter-recs-title">More from the closet</h2>
      </div>

      <ul className="newsletter-recs-list">
        {recommendations.map((newsletter) => (
          <li key={newsletter.slug}>
            <a className="newsletter-recs-card" href={newsletter.href}>
              <div className="newsletter-recs-image-wrap">
                <img
                  className="newsletter-recs-image"
                  src={newsletter.image}
                  alt=""
                  loading="lazy"
                />
              </div>
              <div className="newsletter-recs-body">
                <div className="newsletter-recs-meta">
                  <span>{newsletter.tag}</span>
                  {newsletter.dateLabel && (
                    <>
                      <span aria-hidden="true" className="newsletter-recs-meta-dot">·</span>
                      <time dateTime={newsletter.date}>{newsletter.dateLabel}</time>
                    </>
                  )}
                </div>
                <h3 className="newsletter-recs-card-title">{newsletter.title}</h3>
              </div>
            </a>
          </li>
        ))}
      </ul>

      <a className="newsletter-recs-all" href="/#newsletter">
        See all notes
        <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path d="M4 9h10M9.5 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </aside>
  )
}
