import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import { pathToFileURL } from 'node:url'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  PUBLIC_ROUTE_TYPES,
  ROUTE_SEO,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  getSeoForRoute,
} from '../src/lib/seo.js'
import { PRODUCT_FAQS } from '../src/lib/faqs.js'

const root = process.cwd()
const distDir = path.join(root, 'dist')
const serverDir = path.join(root, '.seo-server')
const newsletterDir = path.join(root, 'src', 'content', 'newsletters')
const STATIC_PAGE_TYPES = ['terms', 'privacy', 'cookies', 'google-play']
const APP_ROUTE_TYPES = PUBLIC_ROUTE_TYPES.filter((type) => !STATIC_PAGE_TYPES.includes(type))

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
      tag: meta.tag || 'Oro Insiders',
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

  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeAttr(seo.description)}">`,
    `<link rel="canonical" href="${escapeAttr(canonical)}">`,
    `<meta name="robots" content="${seo.noindex ? 'noindex,follow' : 'index,follow'}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:type" content="${seo.path.startsWith('/newsletter/') ? 'article' : 'website'}">`,
    `<meta property="og:title" content="${escapeAttr(seo.title)}">`,
    `<meta property="og:description" content="${escapeAttr(seo.description)}">`,
    `<meta property="og:url" content="${escapeAttr(canonical)}">`,
    `<meta property="og:image" content="${escapeAttr(image)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${escapeAttr(seo.title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(seo.description)}">`,
    `<meta name="twitter:image" content="${escapeAttr(image)}">`,
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
  const routeUrls = PUBLIC_ROUTE_TYPES.map((type) => ROUTE_SEO[type])
  const newsletterUrls = newsletters.map((newsletter) => ({
    path: newsletter.href,
    priority: '0.6',
    date: newsletter.date,
  }))

  const urls = [...routeUrls, ...newsletterUrls]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((item) => `  <url>
    <loc>${escapeXml(absoluteUrl(item.path))}</loc>
    <lastmod>${escapeXml(item.date || now)}</lastmod>
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
    `> ${DEFAULT_DESCRIPTION}`,
    '',
    'Oro is an AI stylist app for getting dressed from the clothes a person already owns. It focuses on outfit planning, wardrobe reuse, personal taste, occasion, weather, color, silhouette, body, and virtual try-on.',
    '',
    '## Official URLs',
    '',
    `- Website: ${SITE_URL}`,
    `- Try Oro: ${absoluteUrl('/try-oro')}`,
    `- How it works: ${absoluteUrl('/how-it-works')}`,
    `- Why Oro: ${absoluteUrl('/why-oro')}`,
    `- Editorial archive: ${absoluteUrl('/from-the-closet')}`,
    `- Privacy: ${absoluteUrl('/privacy')}`,
    '',
    '## Key Facts',
    '',
    '- Oro builds outfit recommendations from clothes users already own.',
    '- Oro is not primarily a shopping engine.',
    '- Oro is free to start.',
    '- Oro is available on iOS, with Android in progress.',
    '- Oro does not sell closet data.',
    '- Oro includes virtual try-on for previewing outfits.',
    '- Publisher: Oro Digital Inc.',
    '',
    '## Common Questions',
    '',
    ...PRODUCT_FAQS.map((faq) => `### ${faq.question}\n${faq.answer}\n`),
    '## Latest Editorial',
    '',
    ...newsletters.slice(0, 10).map((item) => `- [${item.title}](${absoluteUrl(item.href)}): ${item.summary}`),
    '',
  ]

  await fs.writeFile(path.join(distDir, 'llms.txt'), lines.join('\n'))
}

async function main() {
  const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8')
  const newsletterEntries = await getNewsletterEntries()
  const newsletters = newsletterEntries.filter((newsletter) => newsletter.readable)
  const unreadableNewsletters = newsletterEntries.filter((newsletter) => !newsletter.readable)
  const serverEntry = pathToFileURL(path.join(serverDir, 'entry-server.js')).href
  const { render, getRnwStyleTag } = await import(serverEntry)

  for (const type of APP_ROUTE_TYPES) {
    const seo = getSeoForRoute({ type })
    const appHtml = await render(seo.path)
    rnwStyleTag = getRnwStyleTag ? getRnwStyleTag() : ''
    await writeRoute(template, seo, appHtml)
  }

  for (const type of STATIC_PAGE_TYPES) {
    const seo = getSeoForRoute({ type })
    const staticPath = path.join(distDir, `${type}.html`)
    const html = await fs.readFile(staticPath, 'utf8')
    await fs.writeFile(staticPath, withSeoHeadOnly(html, seo))
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

  console.log(`Prerendered ${APP_ROUTE_TYPES.length + newsletters.length} React routes, enriched ${STATIC_PAGE_TYPES.length} static pages, and generated sitemap.xml + llms.txt.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
