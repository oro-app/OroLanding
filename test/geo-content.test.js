import test from 'node:test'
import assert from 'node:assert/strict'
import { GEO_GUIDES } from '../src/content/geo/guides.js'
import { RESEARCH_INDEX, RESEARCH_ARTICLES } from '../src/content/geo/research.js'
import { GEO_PAGES, getGeoPage, isIndexableGeoPage, isPublishedResearch } from '../src/lib/geoContent.js'
import { GEO_GUIDE_PATHS, GEO_PATHS } from '../src/lib/geoRoutes.js'
import { ROUTE_SEO, SITE_URL, getSeoForRoute } from '../src/lib/seo.js'

const reviewTime = Date.parse('2026-10-03T12:00:00.000Z')

function completedReport(overrides = {}) {
  return {
    path: '/research/test-completed-report',
    kind: 'research-article',
    status: 'published',
    title: 'Completed Report Fixture | Oro Research',
    description: 'A complete record used to exercise the research publication gate.',
    h1: 'Completed report fixture',
    summary: 'This fixture supplies every required publication field.',
    publicationDate: '2026-10-02T12:00:00.000Z',
    sampleSize: 8,
    sampleUnit: 'participants',
    studied: 'The research question and observation period are specified.',
    included: 'The sampling unit, selection criteria, and exclusions are specified.',
    methodology: 'The measurement and analysis procedure are specified.',
    keyFindings: ['A finding is supported by the fixture methodology.'],
    analysis: [{ heading: 'Analysis', paragraphs: ['The evidence and interpretation are explained.'] }],
    limitations: ['The sample scope limits generalization.'],
    ...overrides,
  }
}

test('research only becomes published after its complete evidence record reaches publication time', () => {
  const report = completedReport()
  assert.equal(isPublishedResearch(report, reviewTime), true)
  assert.equal(isPublishedResearch(report, Date.parse(report.publicationDate)), true)
  assert.equal(isPublishedResearch(report, Date.parse(report.publicationDate) - 1), false)
  for (const status of ['template', 'draft', 'Published', null, undefined]) {
    assert.equal(isPublishedResearch(completedReport({ status }), reviewTime), false, `status ${status}`)
  }
})

test('research requires a valid full UTC ISO timestamp and rejects future or impossible dates', () => {
  const valid = ['2026-10-02T12:00:00.000Z', '2024-02-29T08:00:00.100Z']
  for (const publicationDate of valid) {
    assert.equal(isPublishedResearch(completedReport({ publicationDate }), reviewTime), true, publicationDate)
  }
  const invalid = [null, undefined, '', 'not a date', '2026-10-02', 'October 2, 2026',
    '2026-10-02T12:00:00', '2026-10-02T12:00:00Z', '2026-10-02T08:00:00-04:00',
    '2026-13-02T12:00:00.000Z', '2026-02-31T12:00:00.000Z', '2026-10-04T00:00:00.000Z']
  for (const publicationDate of invalid) {
    assert.equal(isPublishedResearch(completedReport({ publicationDate }), reviewTime), false, String(publicationDate))
  }
})

test('research rejects invalid sample counts and missing descriptive or study fields', () => {
  for (const sampleSize of [null, undefined, 0, -1, 1.5, '8', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(isPublishedResearch(completedReport({ sampleSize }), reviewTime), false, String(sampleSize))
  }
  for (const field of ['title', 'description', 'h1', 'sampleUnit', 'studied', 'included', 'methodology', 'summary']) {
    for (const value of [null, undefined, '', '   ', 8, [], {}]) {
      assert.equal(isPublishedResearch(completedReport({ [field]: value }), reviewTime), false, `${field}: ${JSON.stringify(value)}`)
    }
  }
})

test('research requires actual findings, limitations, and analysis text', () => {
  for (const field of ['keyFindings', 'limitations']) {
    for (const value of [null, undefined, [], [''], ['   '], ['Valid text', null], 'Text', { length: 1 }]) {
      assert.equal(isPublishedResearch(completedReport({ [field]: value }), reviewTime), false, `${field}: ${JSON.stringify(value)}`)
    }
  }
  const invalidAnalysis = [null, undefined, [], 'Analysis', { length: 1 },
    [null], [{}], [{ heading: 'Analysis' }], [{ heading: '', paragraphs: ['Text'] }],
    [{ heading: 'Analysis', paragraphs: ['   '] }], [{ heading: 'Analysis', bullets: [''] }]]
  for (const analysis of invalidAnalysis) {
    assert.equal(isPublishedResearch(completedReport({ analysis }), reviewTime), false, JSON.stringify(analysis))
  }
  assert.equal(isPublishedResearch(completedReport({
    analysis: [{ heading: 'Analysis', bullets: ['The evidence is explained.'] }],
  }), reviewTime), true)
})

test('malformed research records fail the publication gate without throwing', () => {
  for (const value of [null, undefined, '', 8, [], {}]) {
    assert.equal(isPublishedResearch(value, reviewTime), false)
  }
})

test('a valid analysis list cannot mask a malformed opposite list or null section', () => {
  for (const field of ['paragraphs', 'bullets']) {
    const opposite = field === 'paragraphs' ? 'bullets' : 'paragraphs'
    for (const value of [null, 'Text', 8, {}, [''], ['   '], ['Valid text', null]]) {
      const analysis = [{ heading: 'Analysis', [field]: ['Evidence explained.'], [opposite]: value }]
      assert.equal(isPublishedResearch(completedReport({ analysis }), reviewTime), false, `${opposite}: ${JSON.stringify(value)}`)
    }
    const analysis = [{ heading: 'Analysis', [field]: ['Evidence explained.'], [opposite]: [] }]
    assert.equal(isPublishedResearch(completedReport({ analysis }), reviewTime), true)
  }
  assert.equal(isPublishedResearch(completedReport({ analysis: [null] }), reviewTime), false)
})

test('the initial research index and template do not present an unpublished study as evidence', () => {
  assert.ok(RESEARCH_INDEX.answer.includes('No research reports have been published here yet.'))
  assert.equal(RESEARCH_ARTICLES.length, 1)
  const template = RESEARCH_ARTICLES[0]
  assert.equal(template.status, 'template')
  assert.equal(template.publicationDate, null)
  assert.equal(template.sampleSize, null)
  assert.deepEqual(template.keyFindings, [])
  assert.deepEqual(template.charts, [])
  assert.match(template.subtitle, /Unpublished research template/)
  assert.equal(isIndexableGeoPage(getGeoPage(template.path)), false)
  assert.ok(!RESEARCH_INDEX.related.includes(template.path))
  for (const path of RESEARCH_INDEX.related) {
    const page = getGeoPage(path)
    assert.ok(page && isIndexableGeoPage(page), `${path} must render as related public reading`)
  }
})

test('unpublished research gets noindex and no Article schema while guides get Article schema', () => {
  for (const template of RESEARCH_ARTICLES) {
    const seo = getSeoForRoute({ type: 'geo', path: template.path })
    assert.equal(seo.noindex, true)
    assert.equal(seo.ogType, 'website')
    assert.ok(!seo.jsonLd.some((entity) => entity['@type'] === 'Article'))
  }
  for (const guide of GEO_GUIDES) {
    const seo = getSeoForRoute({ type: 'geo', path: guide.path })
    assert.equal(seo.noindex, false)
    assert.equal(seo.ogType, 'article')
    const article = seo.jsonLd.find((entity) => entity['@type'] === 'Article')
    assert.equal(article.headline, guide.h1)
    assert.equal(article.mainEntityOfPage, `${SITE_URL}${guide.path}`)
    assert.ok(!Object.hasOwn(article, 'datePublished'))
  }
})

test('SEO honors the publication gate for incomplete or future reports', () => {
  for (const overrides of [{ status: 'template' }, { publicationDate: '9999-10-04T00:00:00.000Z' },
    { studied: '' }, { included: '' }, { sampleUnit: '' }, { keyFindings: [] }, { methodology: '' }]) {
    const record = completedReport(overrides)
    GEO_PAGES.push(record)
    try {
      const seo = getSeoForRoute({ type: 'geo', path: record.path })
      assert.equal(seo.noindex, true, JSON.stringify(overrides))
      assert.ok(!seo.jsonLd.some((entity) => entity['@type'] === 'Article'))
    } finally {
      GEO_PAGES.pop()
    }
  }
})

test('GEO metadata and paths are unique and every related page is publicly readable', () => {
  assert.equal(new Set(GEO_PAGES.map((page) => page.path)).size, GEO_PAGES.length)
  assert.deepEqual([...GEO_PAGES.map((page) => page.path)].sort(), [...GEO_PATHS].sort())
  assert.deepEqual([...GEO_GUIDES.map((page) => page.path)].sort(), [...GEO_GUIDE_PATHS].sort())
  for (const field of ['title', 'description', 'h1']) {
    const values = GEO_PAGES.map((page) => page[field])
    assert.equal(new Set(values).size, GEO_PAGES.length, `${field} must be unique`)
    assert.ok(values.every((value) => typeof value === 'string' && value.trim()))
    const existingValues = new Set(Object.values(ROUTE_SEO).map((page) => page[field]))
    assert.ok(values.every((value) => !existingValues.has(value)), `${field} must differ from legacy pages`)
  }
  for (const page of GEO_PAGES) {
    assert.match(page.path, /^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/)
    for (const path of page.related || []) {
      const related = getGeoPage(path)
      assert.ok(related && isIndexableGeoPage(related), `${page.path}: ${path} must be a readable related page`)
    }
  }
})

test('the text stylist schema does not invent prices, reviews, ratings, or operating systems', () => {
  for (const path of ['/ai-personal-stylist', '/ai-stylist-you-can-text']) {
    const seo = getSeoForRoute({ type: 'geo', path })
    const applications = seo.jsonLd.filter((entity) => entity['@type'] === 'SoftwareApplication')
    assert.equal(applications.length, 1)
    assert.equal(applications[0].url, `${SITE_URL}/ai-personal-stylist`)
    for (const property of ['offers', 'review', 'reviews', 'aggregateRating', 'rating', 'operatingSystem']) {
      assert.ok(!Object.hasOwn(applications[0], property), `${path}: ${property}`)
    }
  }
})
