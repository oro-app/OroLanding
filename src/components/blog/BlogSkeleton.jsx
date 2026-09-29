import './BlogSkeleton.css'

function Line({ className = '' }) {
  return <span className={`blog-skeleton-line ${className}`} />
}

function ArchiveSkeleton() {
  return (
    <div className="blog-skeleton-archive halo-container" aria-hidden="true">
      <div className="blog-skeleton-archive-hero">
        <div>
          <Line className="blog-skeleton-line--label" />
          <Line className="blog-skeleton-line--display" />
          <Line className="blog-skeleton-line--display blog-skeleton-line--short" />
        </div>
        <div className="blog-skeleton-copy">
          <Line />
          <Line />
          <Line className="blog-skeleton-line--medium" />
        </div>
      </div>

      <div className="blog-skeleton-rule"><Line className="blog-skeleton-line--label" /></div>
      <div className="blog-skeleton-feature">
        <div className="blog-skeleton-block blog-skeleton-feature-image" />
        <div className="blog-skeleton-copy">
          <Line className="blog-skeleton-line--title" />
          <Line />
          <Line />
          <Line className="blog-skeleton-line--medium" />
        </div>
      </div>

      <div className="blog-skeleton-rack-heading">
        <Line className="blog-skeleton-line--title blog-skeleton-line--short" />
        <Line className="blog-skeleton-line--label" />
      </div>
      <div className="blog-skeleton-rack">
        {[0, 1, 2].map((item) => (
          <div className="blog-skeleton-card" key={item}>
            <div className="blog-skeleton-block blog-skeleton-card-image" />
            <Line className="blog-skeleton-line--title" />
            <Line />
            <Line className="blog-skeleton-line--medium" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ArticleSkeleton() {
  return (
    <div className="newsletter-page" aria-hidden="true">
      <div className="newsletter-page-shell blog-skeleton-article">
        <Line className="blog-skeleton-line--label" />
        <div className="blog-skeleton-article-header">
          <Line className="blog-skeleton-line--label" />
          <Line className="blog-skeleton-line--display" />
          <Line className="blog-skeleton-line--display blog-skeleton-line--medium" />
          <Line />
        </div>
        <div className="blog-skeleton-block blog-skeleton-article-image" />
        <div className="blog-skeleton-article-grid">
          <div className="blog-skeleton-copy">
            {[0, 1, 2, 3, 4, 5, 6].map((item) => <Line key={item} className={item === 2 || item === 6 ? 'blog-skeleton-line--medium' : ''} />)}
          </div>
          <div className="blog-skeleton-block blog-skeleton-aside" />
        </div>
      </div>
    </div>
  )
}

export default function BlogSkeleton({ variant }) {
  return (
    <div className="blog-skeleton">
      <p className="blog-skeleton-status">Loading {variant === 'article' ? 'the note' : 'the journal'}…</p>
      {variant === 'article' ? <ArticleSkeleton /> : <ArchiveSkeleton />}
    </div>
  )
}
