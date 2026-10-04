import { GEO_GUIDES } from '../content/geo/guides.js'
import { GUIDE_INDEX } from '../content/geo/guideIndex.js'
import { RESEARCH_INDEX, RESEARCH_ARTICLES } from '../content/geo/research.js'
import { ENGINEERING_NOTES } from '../content/geo/engineering.js'

export function isPublishedEngineeringNote(note, now = Date.now()) {
  if (!note || typeof note !== 'object') return false
  const hasText = (value) => typeof value === 'string' && value.trim().length > 0
  const hasTextList = (value) => Array.isArray(value) && value.length > 0 && value.every(hasText)
  const hasOptionalTextList = (value) => value === undefined || (Array.isArray(value) && value.every(hasText))
  const publicationTime = typeof note.publicationDate === 'string' ? Date.parse(note.publicationDate) : NaN
  return note.status === 'published'
    && typeof note.publicationDate === 'string'
    && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(note.publicationDate)
    && Number.isFinite(publicationTime) && publicationTime <= now
    && new Date(publicationTime).toISOString() === note.publicationDate
    && [note.title, note.description, note.h1, note.author].every(hasText)
    && hasTextList(note.answer)
    && Array.isArray(note.sections) && note.sections.length > 0
    && note.sections.every((section) => hasText(section?.heading)
      && hasOptionalTextList(section.paragraphs) && hasOptionalTextList(section.bullets)
      && (hasTextList(section.paragraphs) || hasTextList(section.bullets)))
}

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
  { ...GUIDE_INDEX, kind: 'guide-index' },
  ...GEO_GUIDES.map((page) => ({ ...page, kind: 'guide' })),
  { ...RESEARCH_INDEX, kind: 'research-index' },
  ...ENGINEERING_NOTES.map((page) => ({ ...page, kind: 'engineering-note' })),
  ...RESEARCH_ARTICLES.map((page) => ({ ...page, kind: 'research-article' })),
]

export function getGeoPage(path) {
  return GEO_PAGES.find((page) => page.path === path)
}

export function isIndexableGeoPage(page) {
  if (page.kind === 'engineering-note') return !page.noindex && isPublishedEngineeringNote(page)
  return !page.noindex && (page.kind !== 'research-article' || isPublishedResearch(page))
}
