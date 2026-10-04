import { GEO_GUIDES } from '../content/geo/guides.js'
import { RESEARCH_INDEX, RESEARCH_ARTICLES } from '../content/geo/research.js'

export function isPublishedResearch(article, now = Date.now()) {
  if (!article || typeof article !== 'object') return false
  const publicationTime = typeof article.publicationDate === 'string' ? Date.parse(article.publicationDate) : NaN
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0
  const hasTextList = (value) => Array.isArray(value) && value.length > 0 && value.every(hasText)
  const hasOptionalTextList = (value) => value === undefined || (Array.isArray(value) && value.every(hasText))
  const validDate = typeof article.publicationDate === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(article.publicationDate)
    && Number.isFinite(publicationTime)
    && new Date(publicationTime).toISOString() === article.publicationDate
  return article.status === 'published'
    && validDate && publicationTime <= now
    && Number.isSafeInteger(article.sampleSize) && article.sampleSize > 0
    && [article.title, article.description, article.h1, article.methodology, article.summary, article.studied, article.included, article.sampleUnit].every(hasText)
    && hasTextList(article.keyFindings)
    && hasTextList(article.limitations)
    && Array.isArray(article.analysis) && article.analysis.length > 0
    && article.analysis.every((section) => hasText(section?.heading)
      && hasOptionalTextList(section.paragraphs) && hasOptionalTextList(section.bullets)
      && (hasTextList(section.paragraphs) || hasTextList(section.bullets)))
}

export const GEO_PAGES = [
  ...GEO_GUIDES.map((page) => ({ ...page, kind: 'guide' })),
  { ...RESEARCH_INDEX, kind: 'research-index' },
  ...RESEARCH_ARTICLES.map((page) => ({ ...page, kind: 'research-article' })),
]

export function getGeoPage(path) {
  return GEO_PAGES.find((page) => page.path === path)
}

export function isIndexableGeoPage(page) {
  return page.kind !== 'research-article' || isPublishedResearch(page)
}
