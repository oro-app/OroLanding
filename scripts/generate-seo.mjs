import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { pathToFileURL } from 'node:url'
import {
  DEFAULT_IMAGE,
  DEFAULT_IMAGE_META,
  PUBLIC_ROUTE_TYPES,
  ROUTE_SEO,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  getSeoForRoute,
} from '../src/lib/seo.js'
import { GEO_PAGES, isIndexableGeoPage } from '../src/lib/geoContent.js'
import { GEO_PATHS, ORO_DESCRIPTION } from '../src/lib/geoRoutes.js'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const serverDir = path.join(root, '.seo-server')
const newsletterDir = path.join(root, 'src', 'content', 'newsletters')
const STATIC_PAGE_TYPES = ['terms', 'privacy', 'app-terms', 'app-privacy', 'cookies', 'google-play']
const APP_ROUTE_TYPES = [...PUBLIC_ROUTE_TYPES.filter((type) => !STATIC_PAGE_TYPES.includes(type)), 'beta', 'beta-career', 'beta-dating', 'feedback']

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/`/g, '&#96;')
}

function escapeXml(value = '') {
  return escapeHtml(value)
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function slugFromFile(file) {
  return file.replace(/\.mdx$/, '')
}

function readMeta(source, file) {
  const match = source.match(/export\s+const\s+meta\s*=\s*({[\s\S]*?\n})/)
  if (!match) return {}

  const sandbox = { meta: {} }
  try {
    vm.runInNewContext(`meta = ${match[1]}`, sandbox, {
      filename: file,
      timeout: 1000,
    })
    return sandbox.meta || {}
  } catch (error) {
    console.warn(`Could not parse newsletter meta for ${file}: ${error.message}`)
    return {}
  }
}

function formatNewsletterDate(value) {
  if (!value) return ''
  const parts = String(value).split('-').map(Number)
  const date = parts.length === 3
    ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]))
    : new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

async function getNewsletterEntries() {
  const files = await fs.readdir(newsletterDir)
  const newsletters = []

  for (const file of files.filter((name) => name.endsWith('.mdx'))) {
    const fullPath = path.join(newsletterDir, file)
    const source = await fs.readFile(fullPath, 'utf8')
    const meta = readMeta(source, file)
    const slug = meta.slug || slugFromFile(file)

    if (meta.published !== true) continue

    newsletters.push({
      slug,
      href: `/newsletter/${slug}`,
      title: meta.title || slug.replace(/-/g, ' '),
      tag: meta.tag || 'oro insiders',
      date: meta.date || '',
      dateLabel: formatNewsletterDate(meta.date),
      image: meta.image || DEFAULT_IMAGE,
      summary: meta.summary || '',
      readTime: meta.readTime || '',
      readable: meta.comingSoon !== true,
    })
  }

  return newsletters.sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

function removeExistingSeoTags(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, '')
    .replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')
}

function seoHeadTags(seo) {
  const canonical = absoluteUrl(seo.path)
  const image = absoluteUrl(seo.image || DEFAULT_IMAGE)
  const isDefaultImage = image === absoluteUrl(DEFAULT_IMAGE)

  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeAttr(seo.description)}">`,
    `<link rel="canonical" href="${escapeAttr(canonical)}">`,
    `<meta name="robots" content="${seo.noindex ? 'noindex,follow' : 'index,follow'}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:type" content="${seo.ogType || (seo.path.startsWith('/newsletter/') ? 'article' : 'website')}">`,
    `<meta property="og:title" content="${escapeAttr(seo.title)}">`,
    `<meta property="og:description" content="${escapeAttr(seo.description)}">`,
    `<meta property="og:url" content="${escapeAttr(canonical)}">`,
    `<meta property="og:image" content="${escapeAttr(image)}">`,
    ...(isDefaultImage ? [
      `<meta property="og:image:type" content="${DEFAULT_IMAGE_META.type}">`,
      `<meta property="og:image:width" content="${DEFAULT_IMAGE_META.width}">`,
      `<meta property="og:image:height" content="${DEFAULT_IMAGE_META.height}">`,
      `<meta property="og:image:alt" content="${escapeAttr(DEFAULT_IMAGE_META.alt)}">`,
    ] : []),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeAttr(seo.title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(seo.description)}">`,
    `<meta name="twitter:image" content="${escapeAttr(image)}">`,
    ...(isDefaultImage ? [`<meta name="twitter:image:alt" content="${escapeAttr(DEFAULT_IMAGE_META.alt)}">`] : []),
    `<script type="application/ld+json" data-seo-jsonld="true">${safeJson(seo.jsonLd)}</script>`,
  ].join('\n    ')
}

function withSeo(template, seo, appHtml) {
  const cleaned = removeExistingSeoTags(template)
  return cleaned
    .replace('</head>', `    ${seoHeadTags(seo)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
}

function withSeoHeadOnly(template, seo) {
  const cleaned = removeExistingSeoTags(template)
  return cleaned.replace('</head>', `    ${seoHeadTags(seo)}\n  </head>`)
}

function routeOutputPath(routePath) {
  if (routePath === '/') return path.join(distDir, 'index.html')
  return path.join(distDir, routePath.replace(/^\/+/, ''), 'index.html')
}

async function writeRoute(template, seo, appHtml) {
  const output = routeOutputPath(seo.path)
  await fs.mkdir(path.dirname(output), { recursive: true })
  // react-native-web critical CSS so @oro/ui components render styled pre-hydration.
  const styled = rnwStyleTag
    ? withSeo(template, seo, appHtml).replace('</head>', `${rnwStyleTag}</head>`)
    : withSeo(template, seo, appHtml)
  await fs.writeFile(output, styled)
}

let rnwStyleTag = ''

async function writeSitemap(newsletters) {
  const now = new Date().toISOString().slice(0, 10)
  const routeUrls = PUBLIC_ROUTE_TYPES.map((type) => ROUTE_SEO[type]).filter((route) => !route.noindex)
  const newsletterUrls = newsletters.map((newsletter) => ({
    path: newsletter.href,
    priority: '0.6',
    date: newsletter.date,
  }))

  const geoUrls = GEO_PAGES.filter(isIndexableGeoPage).map((page) => ({
    path: page.path,
    priority: '0.7',
    date: page.dateModified || page.publicationDate,
    geo: true,
  }))
  const urls = [...routeUrls, ...newsletterUrls, ...geoUrls]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>
    <loc>${escapeXml(absoluteUrl(item.path))}</loc>
    ${item.geo && !item.date ? '' : `<lastmod>${escapeXml(item.date || now)}</lastmod>`}
    <changefreq>${item.path === '/' ? 'weekly' : item.path.startsWith('/newsletter/') ? 'monthly' : 'monthly'}</changefreq>
    <priority>${escapeXml(item.priority || '0.5')}</priority>
  </url>`).join('\n')}
</urlset>
`

  await fs.writeFile(path.join(distDir, 'sitemap.xml'), xml)
}

async function writeLlms(newsletters) {
  const lines = [
    `# ${SITE_NAME}`,
    '',
    `> ${ORO_DESCRIPTION}`,
    '',
    'The styling guides below offer general advice. Oro personalizes advice around style and the clothes a person already owns. Access starts through the existing beta signup.',
    '',
    '## Official URLs',
    '',
    `- Website: ${SITE_URL}`,
    `- Meet Oro / beta signup: ${absoluteUrl('/beta')}`,
    `- Try oro: ${absoluteUrl('/try-oro')}`,
    `- How it works: ${absoluteUrl('/how-it-works')}`,
    `- Why oro: ${absoluteUrl('/why-oro')}`,
    `- Editorial archive: ${absoluteUrl('/from-the-closet')}`,
    `- Terms: ${absoluteUrl('/terms')}`,
    `- Privacy: ${absoluteUrl('/privacy')}`,
    '',
    '## Styling guides',
    '',
    `- [Style guides](${absoluteUrl('/guides')}): Browse all Oro styling guides.`,
    ...GEO_PAGES.filter((page) => page.kind === 'guide').map((page) => `- [${page.h1}](${absoluteUrl(page.path)}): ${page.description}`),
    '',
    '## Research & Engineering',
    '',
    ...GEO_PAGES.filter((page) => (page.kind.startsWith('research') || page.kind === 'engineering-note') && isIndexableGeoPage(page)).map((page) => `- [${page.h1}](${absoluteUrl(page.path)}): ${page.summary || page.description}`),
    '',
    '## Latest Editorial',
    '',
    ...newsletters.slice(0, 10).map((item) => `- [${item.title}](${absoluteUrl(item.href)}): ${item.summary}`),
    '',
  ]

  await fs.writeFile(path.join(distDir, 'llms.txt'), lines.join('\n'))
}

async function main() {
  const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8')
  const manifest = JSON.parse(await fs.readFile(path.join(distDir, '.vite', 'manifest.json'), 'utf8'))
  const legalStylesheet = manifest['src/legal.css']?.file
  const headingsStylesheet = manifest['src/serif-headings.css']?.file
  function importedStylesheets(key, seen = new Set()) {
    if (seen.has(key)) return []
    seen.add(key)
    const entry = manifest[key]
    return [...(entry?.css || []), ...(entry?.imports || []).flatMap((dependency) => importedStylesheets(dependency, seen))]
  }
  const betaStylesheets = [...new Set(importedStylesheets('src/components/beta/Beta.jsx'))]
  const geoStylesheets = [...new Set(importedStylesheets('src/components/geo/GeoPage.jsx'))]
  if (!geoStylesheets.length) throw new Error('Missing GEO stylesheets in the client build manifest')
  const geoTemplate = template.replace('</head>', `${geoStylesheets.map((file) => `<link rel="stylesheet" crossorigin href="/${file}">`).join('\n')}\n</head>`)
  if (!betaStylesheets?.length) throw new Error('Missing signup stylesheets in the client build manifest')
  const betaTemplate = template.replace('</head>', `${betaStylesheets.map((file) => `<link rel="stylesheet" crossorigin href="/${file}">`).join('\n')}\n</head>`)
  if (!headingsStylesheet) throw new Error('Missing preview heading stylesheet in the client build manifest')
  if (!legalStylesheet) throw new Error('Missing legal page stylesheet in the client build manifest')
  const newsletterEntries = await getNewsletterEntries()
  const newsletters = newsletterEntries.filter((newsletter) => newsletter.readable)
  const unreadableNewsletters = newsletterEntries.filter((newsletter) => !newsletter.readable)
  const serverEntry = pathToFileURL(path.join(serverDir, 'entry-server.js')).href
  const { render, getRnwStyleTag } = await import(serverEntry)

  for (const type of APP_ROUTE_TYPES) {
    const seo = getSeoForRoute({ type })
    const appHtml = await render(seo.path)
    rnwStyleTag = getRnwStyleTag ? getRnwStyleTag() : ''
    await writeRoute(type.startsWith('beta') ? betaTemplate : template, seo, appHtml)
  }

  for (const type of STATIC_PAGE_TYPES) {
    const seo = getSeoForRoute({ type })
    const staticPath = path.join(distDir, `${seo.path.replace(/^\/+/, '')}.html`)
    // Public HTML bypasses Vite's asset rewriting, so use the emitted CSS URL.
    const html = (await fs.readFile(staticPath, 'utf8'))
      .replace('href="/src/legal.css"', `href="/${legalStylesheet}"`)
      .replace('href="/src/serif-headings.css"', `href="/${headingsStylesheet}"`)
    await fs.writeFile(staticPath, withSeoHeadOnly(html, seo))
  }

  if (GEO_PAGES.length !== GEO_PATHS.length || GEO_PAGES.some((page) => !GEO_PATHS.includes(page.path))) {
    throw new Error('GEO routing and content paths must match')
  }
  for (const page of GEO_PAGES) {
    const seo = getSeoForRoute({ type: 'geo', path: page.path })
    await writeRoute(geoTemplate, seo, await render(page.path))
  }

  for (const newsletter of newsletters) {
    const seo = getSeoForRoute({ type: 'newsletter', slug: newsletter.slug }, newsletter)
    await writeRoute(template, seo, await render(newsletter.href))
  }

  for (const newsletter of unreadableNewsletters) {
    const route = { type: 'newsletter', slug: newsletter.slug }
    const seo = getSeoForRoute(route, null)
    await writeRoute(template, seo, await render(newsletter.href))
  }

  await writeSitemap(newsletters)
  await writeLlms(newsletters)
  await fs.rm(serverDir, { recursive: true, force: true })

  console.log(`Prerendered ${APP_ROUTE_TYPES.length + newsletters.length + GEO_PAGES.length} React routes, enriched ${STATIC_PAGE_TYPES.length} static pages, and generated sitemap.xml + llms.txt.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
