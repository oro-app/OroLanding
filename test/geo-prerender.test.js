import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { GEO_PAGES, isIndexableGeoPage } from '../src/lib/geoContent.js'
import { SITE_URL, getSeoForRoute } from '../src/lib/seo.js'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const manifest = JSON.parse(await read('dist/.vite/manifest.json'))
const sitemap = await read('dist/sitemap.xml')
const llms = await read('dist/llms.txt')
const homeHtml = await read('dist/index.html')
const pages = await Promise.all(GEO_PAGES.map(async (page) => ({
  page,
  html: await read(`dist${page.path}/index.html`),
})))

function decodeEntities(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
}

function attribute(tag, name) {
  return decodeEntities(tag.match(new RegExp(`\\b${name}="([^"]*)"`, 'i'))?.[1] || '')
}

function elements(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))].map(([tag]) => tag)
}

function importedStylesheets(key, seen = new Set()) {
  if (seen.has(key)) return []
  seen.add(key)
  const entry = manifest[key]
  return [...(entry?.css || []), ...(entry?.imports || []).flatMap((dependency) => importedStylesheets(dependency, seen))]
}

function structuredData(html) {
  const scripts = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  assert.equal(scripts.length, 1)
  const graph = JSON.parse(scripts[0][1])
  assert.ok(Array.isArray(graph))
  return graph
}

test('every GEO page includes crawlable headings, direct answers, sections, and beta CTA in its HTML', () => {
  for (const { page, html } of pages) {
    const body = html.slice(html.indexOf('<body'))
    const visible = decodeEntities(body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ''))
    const headings = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)]
    assert.equal(headings.length, 1, page.path)
    assert.equal(decodeEntities(headings[0][1].replace(/<[^>]+>/g, '')), page.h1, page.path)
    const expected = page.kind === 'research-article'
      ? [page.summary, page.methodology, ...page.limitations, ...page.definitions.map(({ term, definition }) => `${term}${definition}`)]
      : [...page.answer, ...page.sections.flatMap(({ heading, paragraphs = [], bullets = [] }) => [heading, ...paragraphs, ...bullets])]
    for (const text of expected) assert.ok(visible.includes(text), `${page.path} must prerender ${text}`)
    assert.match(body, /href="\/beta"[^>]*>[\s\S]*?Meet Oro/)
    for (const related of page.related || []) assert.ok(body.includes(`href="${related}"`), `${page.path} must link ${related}`)
    for (const source of page.sources || []) {
      assert.ok(body.includes(`href="${source.url}"`), `${page.path} must link ${source.url}`)
      assert.ok(visible.includes(source.title), `${page.path} must identify ${source.title}`)
    }
  }
})

test('new pages have one unique title and description, correct canonical, and matching social metadata', () => {
  assert.equal(SITE_URL, 'https://www.askoro.now', 'GEO must preserve the existing site origin')
  const homeCanonical = elements(homeHtml.slice(0, homeHtml.indexOf('</head>')), 'link')
    .find((tag) => attribute(tag, 'rel') === 'canonical')
  const existingOrigin = new URL(attribute(homeCanonical, 'href')).origin
  const titles = new Set()
  const descriptions = new Set()
  for (const { page, html } of pages) {
    const head = html.slice(0, html.indexOf('</head>'))
    const titleTags = [...head.matchAll(/<title>([\s\S]*?)<\/title>/g)]
    assert.equal(titleTags.length, 1, page.path)
    const title = decodeEntities(titleTags[0][1])
    assert.equal(title, page.title)
    assert.ok(!titles.has(title), `${page.path} must have its own title`)
    titles.add(title)
    const metadata = elements(head, 'meta')
    const descriptionTags = metadata.filter((tag) => attribute(tag, 'name') === 'description')
    assert.equal(descriptionTags.length, 1, page.path)
    const description = attribute(descriptionTags[0], 'content')
    assert.equal(description, page.description)
    assert.ok(!descriptions.has(description), `${page.path} must have its own description`)
    descriptions.add(description)
    const canonicals = elements(head, 'link').filter((tag) => attribute(tag, 'rel') === 'canonical')
    assert.equal(canonicals.length, 1, page.path)
    const canonical = attribute(canonicals[0], 'href')
    assert.equal(canonical, `${SITE_URL}${page.path}`)
    assert.equal(new URL(canonical).origin, existingOrigin)
    const og = (property) => attribute(metadata.find((tag) => attribute(tag, 'property') === property) || '', 'content')
    assert.equal(og('og:title'), title)
    assert.equal(og('og:description'), description)
    assert.equal(og('og:url'), canonical)
  }
})

test('each prerendered page links its emitted GEO stylesheet and imported CSS before hydration', async () => {
  const stylesheets = [...new Set(importedStylesheets('src/components/geo/GeoPage.jsx'))]
  assert.ok(stylesheets.length, 'Build first with npm run build; the GEO entry must emit CSS')
  for (const asset of stylesheets) assert.ok((await read(`dist/${asset}`)).length > 0, asset)
  for (const { page, html } of pages) {
    const head = html.slice(0, html.indexOf('</head>'))
    const hrefs = elements(head, 'link').filter((tag) => attribute(tag, 'rel') === 'stylesheet').map((tag) => attribute(tag, 'href'))
    for (const asset of stylesheets) assert.ok(hrefs.includes(`/${asset}`), `${page.path} must link ${asset} before its body`)
  }
})

test('prerendered JSON-LD matches visible page content and does not invent software commercial claims', () => {
  for (const { page, html } of pages) {
    const graph = structuredData(html)
    const webPage = graph.find((entity) => entity['@type'] === 'WebPage')
    assert.equal(webPage.name, page.title)
    assert.equal(webPage.description, page.description)
    assert.equal(webPage.url, `${SITE_URL}${page.path}`)
    const seo = getSeoForRoute({ type: 'geo', path: page.path })
    assert.deepEqual(graph, seo.jsonLd)
    const breadcrumbs = graph.find((entity) => entity['@type'] === 'BreadcrumbList').itemListElement
    assert.equal(breadcrumbs.at(-1).item, `${SITE_URL}${page.path}`)
    if (page.kind === 'engineering-note') {
      const article = graph.find((entity) => entity['@type'] === 'Article')
      assert.ok(article, page.path)
      assert.equal(article.datePublished, page.publicationDate)
      const author = article.author['@id']
        ? graph.find((entity) => entity['@id'] === article.author['@id'])
        : article.author
      assert.equal(author.name.toLowerCase(), 'oro')
      const byline = html.match(/<p\b[^>]*class="geo-note-meta"[^>]*>([\s\S]*?)<\/p>/)?.[1] || ''
      assert.ok(decodeEntities(byline.replace(/<[^>]+>/g, '')).includes('By Oro'), `${page.path} must show its Oro byline`)
      assert.ok(elements(html, 'time').some((tag) => attribute(tag, 'datetime') === page.publicationDate), `${page.path} must show its publication date`)
    }
    for (const application of graph.filter((entity) => entity['@type'] === 'SoftwareApplication')) {
      for (const property of ['offers', 'review', 'reviews', 'aggregateRating', 'rating', 'operatingSystem']) {
        assert.ok(!Object.hasOwn(application, property), `${page.path}: ${property}`)
      }
    }
  }
})

test('published notes, research index, guides, and hub are discoverable while the empirical template is excluded and noindexed', () => {
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => decodeEntities(url))
  assert.equal(new Set(locations).size, locations.length, 'Sitemap must not repeat URLs')
  for (const { page, html } of pages) {
    const canonical = `${SITE_URL}${page.path}`
    const robots = elements(html.slice(0, html.indexOf('</head>')), 'meta')
      .filter((tag) => attribute(tag, 'name') === 'robots')
    assert.equal(robots.length, 1, page.path)
    if (isIndexableGeoPage(page)) {
      assert.equal(attribute(robots[0], 'content'), 'index,follow')
      assert.ok(locations.includes(canonical), page.path)
      assert.ok(llms.includes(`(${canonical})`), page.path)
    } else {
      assert.equal(attribute(robots[0], 'content'), 'noindex,follow')
      assert.ok(!locations.includes(canonical), page.path)
      assert.ok(!llms.includes(canonical), page.path)
      assert.ok(!structuredData(html).some((entity) => entity['@type'] === 'Article'))
      if (page.kind === 'research-article') {
        assert.ok(decodeEntities(html).includes('Unpublished research template.'))
      }
    }
  }
  const index = pages.find(({ page }) => page.kind === 'research-index').html
  assert.ok(decodeEntities(index).includes('Notes on the problems behind personal styling: context, outfit quality, and learning from feedback.'))
  const notes = pages.filter(({ page }) => page.kind === 'engineering-note')
  assert.equal(notes.length, 3)
  for (const { page } of notes) {
    const position = index.indexOf(`href="${page.path}"`)
    assert.ok(position > -1, `${page.path} must be linked from the research index`)
    assert.ok(position < index.indexOf('class="geo-cta"'), `${page.path} must appear before the beta CTA`)
  }
  for (const { page } of pages.filter(({ page }) => page.kind === 'research-article')) {
    assert.ok(!index.includes(`href="${page.path}"`), `${page.path} must not be linked from the research index`)
  }
})

test('the public guides hub statically links all ten guides with WebPage metadata', () => {
  assert.equal(pages.length, 16)
  const hub = pages.find(({ page }) => page.path === '/guides')
  assert.ok(hub)
  const hrefs = elements(hub.html.slice(hub.html.indexOf('<body')), 'a').map((tag) => attribute(tag, 'href'))
  const guides = pages.filter(({ page }) => page.kind === 'guide')
  assert.equal(guides.length, 10)
  for (const { page } of guides) assert.ok(hrefs.includes(page.path), `/guides must statically link ${page.path}`)
  const graph = structuredData(hub.html)
  assert.ok(graph.some((entity) => entity['@type'] === 'WebPage' && entity.url === `${SITE_URL}/guides`))
  assert.ok(!graph.some((entity) => entity['@type'] === 'Article'))
})

test('headers and footers omit guide and Research navigation while the homepage and styling guides keep Research links hidden', () => {
  for (const { page, html } of [...pages, { page: { path: '/' }, html: homeHtml }]) {
    const body = html.slice(html.indexOf('<body'))
    for (const [, tag, content] of body.matchAll(/<(header|footer)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const links = elements(content, 'a').map((element) => attribute(element, 'href'))
      assert.ok(!links.some((href) => /^\/guides\/?$/.test(href)), `${page.path} ${tag} must not link the guides hub`)
      assert.ok(!links.some((href) => /^\/research(?:\/|$)/.test(href)), `${page.path} ${tag} must not link Research`)
      if (tag === 'footer') assert.doesNotMatch(decodeEntities(content), /style guides/i, `${page.path} footer must not show a Style guides label`)
    }
    if (page.path === '/' || ['guide', 'guide-index'].includes(page.kind)) {
      const links = elements(body, 'a').map((tag) => attribute(tag, 'href'))
      assert.ok(!links.some((href) => href === '/research' || href.startsWith('/research/')), `${page.path} must not publicly link Research`)
    }
  }
})
