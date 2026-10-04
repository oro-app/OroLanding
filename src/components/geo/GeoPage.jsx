import { Heading, Text } from 'oro-kit'
import { GEO_PAGES, getGeoPage, isPublishedResearch, isIndexableGeoPage } from '../../lib/geoContent.js'
import { ORO_DESCRIPTION } from '../../lib/geoRoutes.js'
import { trackCtaClick } from '../../lib/analytics.js'
import './GeoPage.css'

function ContentSection({ heading, paragraphs = [], bullets = [] }) {
  return (
    <section className="geo-section">
      <Heading as="h2" variant="section">{heading}</Heading>
      {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {bullets.length > 0 && <ul>{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
    </section>
  )
}

function RelatedPages({ paths, heading = 'Keep reading', descriptions = false }) {
  const pages = paths.map(getGeoPage).filter((page) => page && isIndexableGeoPage(page))
  if (!pages.length) return null
  return (
    <nav className={`geo-related${descriptions ? ' geo-guide-group' : ''}`} aria-label={heading}>
      <Heading as="h2" variant="section">{heading}</Heading>
      <ul>{pages.map((page) => <li key={page.path}>
        <a href={page.path}>{page.h1}</a>
        {descriptions && <p>{page.description}</p>}
      </li>)}</ul>
    </nav>
  )
}

function OroCta() {
  return (
    <aside className="geo-cta" aria-labelledby="geo-cta-title">
      <Heading as="h2" variant="section" id="geo-cta-title">Make it work for your closet.</Heading>
      <p>{ORO_DESCRIPTION}</p>
      <p>Want advice based on what you actually own? Join the Oro beta to start the conversation.</p>
      <a href="/beta" className="oro-button oro-button--primary"
        onClick={() => trackCtaClick('get_started_click', { location: 'geo-article', destination: 'beta' })}>
        Meet Oro
      </a>
    </aside>
  )
}

function PublicationMeta({ page }) {
  return <p className="geo-note-meta">
    <span>By {page.author}</span><span aria-hidden="true">·</span>
    <time dateTime={page.publicationDate}>{new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(page.publicationDate))}</time>
  </p>
}

function EngineeringNotes({ pages }) {
  if (!pages.length) return null
  return <nav className="geo-publications" aria-label="Engineering notes">
    <ol>{pages.map((page, index) => <li key={page.path}>
      <span className="geo-publication-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <Text variant="label" muted>{page.category}</Text>
        <Heading as="h2" variant="section"><a href={page.path}>{page.h1}</a></Heading>
        <p>{page.description}</p>
      </div>
    </li>)}</ol>
  </nav>
}

function Sources({ sources = [] }) {
  if (!sources.length) return null
  return <section className="geo-sources" aria-labelledby="geo-sources-title">
    <Heading as="h2" variant="section" id="geo-sources-title">Further reading</Heading>
    <ul>{sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
  </section>
}

function ResearchArticle({ page }) {
  const published = isPublishedResearch(page)
  return (
    <>
      {!published && <aside className="geo-template-notice"><strong>Unpublished research template.</strong> This page contains no study results and should not be cited as research.</aside>}
      {page.subtitle && <p className="geo-subtitle">{page.subtitle}</p>}
      {published && <dl className="geo-study-meta">
        <dt>Published</dt><dd><time dateTime={page.publicationDate}>{new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(page.publicationDate))}</time></dd>
        <dt>Sample size</dt><dd>{page.sampleSize.toLocaleString('en')} {page.sampleUnit || 'observations'}</dd>
      </dl>}
      <ContentSection heading={published ? 'Citation summary' : 'What this template is for'} paragraphs={[page.summary]} />
      <ContentSection heading="Key findings" bullets={page.keyFindings} paragraphs={page.keyFindings.length ? [] : ['No findings have been published. A completed report will put its supported results here.']} />
      <ContentSection heading="What was studied?" paragraphs={page.studied ? [page.studied] : ['The study question, scope and observation period have not been set.']} />
      <ContentSection heading="Who or what was included?" paragraphs={page.included ? [page.included] : ['No sample has been selected. A completed report must explain who or what was included, the sampling unit and exclusions.']} />
      <ContentSection heading="How was it measured?" paragraphs={[page.methodology]} />
      {page.definitions?.length > 0 && <section className="geo-section">
        <Heading as="h2" variant="section">Definitions</Heading>
        <dl className="geo-definitions">{page.definitions.map(({ term, definition }) => <div key={term}><dt>{term}</dt><dd>{definition}</dd></div>)}</dl>
      </section>}
      {page.analysis.map((section) => <ContentSection key={section.heading} {...section} />)}
      {page.charts?.map((chart) => <figure className="geo-chart" key={chart.src}><img src={chart.src} alt={chart.alt} loading="lazy" decoding="async" />{chart.caption && <figcaption>{chart.caption}</figcaption>}</figure>)}
      <ContentSection heading="What are the limitations?" bullets={page.limitations} />
    </>
  )
}

export default function GeoPage({ path }) {
  const page = getGeoPage(path)
  if (!page) return null
  const engineering = page.kind === 'engineering-note'
  const research = page.kind.startsWith('research') || engineering
  const publishedNotes = GEO_PAGES.filter((item) => item.kind === 'engineering-note' && isIndexableGeoPage(item))
  const publishedReports = GEO_PAGES.filter((item) => item.kind === 'research-article' && isPublishedResearch(item))
  return (
    <article className="geo-page">
      <div className="geo-shell">
        <nav className="geo-breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Oro</a><span aria-hidden="true">/</span>
          {(page.kind === 'research-article' || engineering) && <><a href="/research">Research & Engineering</a><span aria-hidden="true">/</span></>}
          <span aria-current="page">{page.h1}</span>
        </nav>
        <header className="geo-heading">
          <Text variant="label" muted>{page.category || 'Oro Research'}</Text>
          <Heading as="h1" variant="display">{page.h1}</Heading>
        </header>
        <div className="geo-body">
          {engineering && isIndexableGeoPage(page) && <PublicationMeta page={page} />}
          {page.kind === 'research-article' ? <ResearchArticle page={page} /> : <>
            <div className="geo-answer">{page.answer.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
            {page.sections.map((section) => <ContentSection key={section.heading} {...section} />)}
            {page.groups?.map((group) => <RelatedPages key={group.heading} heading={group.heading} paths={group.paths} descriptions />)}
            {page.personalization && <ContentSection heading="Where a general guide stops" paragraphs={[page.personalization]} />}
          </>}
          {page.kind === 'research-index' && <EngineeringNotes pages={publishedNotes} />}
          {page.kind === 'research-index' && publishedReports.length > 0 && <RelatedPages heading="Published reports" paths={publishedReports.map((item) => item.path)} />}
          {engineering && <Sources sources={page.sources} />}
          <OroCta />
          <RelatedPages paths={page.related || []} heading={research ? 'Related reading' : 'Related guides'} />
          {research && <a className="geo-research-link" href="/ai-personal-stylist">What is an AI personal stylist?</a>}
        </div>
      </div>
    </article>
  )
}
