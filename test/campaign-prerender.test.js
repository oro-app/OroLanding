import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
const read = (path) => readFile(new URL(path, root), 'utf8')
const html = await read('dist/beta/index.html')
const manifest = JSON.parse(await read('dist/.vite/manifest.json'))
const config = JSON.parse(await read('vercel.json'))
function importedStylesheets(key, seen = new Set()) {
  if (seen.has(key)) return []
  seen.add(key)
  const entry = manifest[key]
  return [...(entry?.css || []), ...(entry?.imports || []).flatMap((dependency) => importedStylesheets(dependency, seen))]
}
const betaCss = [...new Set(importedStylesheets('src/components/beta/Beta.jsx'))]

test('beta HTML remains on the welcome screen without a temporary status banner', () => {
  assert.match(html, /class="beta-page beta-page--welcome /,
    'Build first with npm run build in preview or production mode')
  assert.match(html, /id="welcome-title"/)
  assert.doesNotMatch(html, /class="beta-draft-bar"/)
  assert.doesNotMatch(html, /beta-coming-soon/)
})

test('the removed signup endpoint is not prerendered', async () => {
  await assert.rejects(access(new URL('dist/signup/index.html', root)))
})

test('the welcome layout and entrance styles are linked before the prerendered body', async () => {
  const head = html.slice(0, html.indexOf('</head>'))
  const stylesheets = [...head.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => tag)
    .filter((tag) => /\brel="stylesheet"/.test(tag))
    .map((tag) => tag.match(/\bhref="([^"]+)"/)?.[1])
  assert.ok(betaCss.length, 'The Beta entry must have an emitted stylesheet')
  for (const asset of betaCss) {
    assert.ok(stylesheets.includes(`/${asset}`), `${asset} must be linked in the HTML head`)
    assert.ok((await read(`dist/${asset}`)).length > 0)
  }
})

test('beta and invite entry URLs serve prerendered HTML before the homepage fallback', () => {
  const fallbackIndex = config.rewrites.findIndex(({ destination }) => destination === '/index.html')
  assert.ok(fallbackIndex >= 0, 'The SPA fallback must be identifiable')
  for (const source of ['/beta', '/invite']) {
    const index = config.rewrites.findIndex((rule) => rule.source === source)
    assert.ok(index >= 0 && index < fallbackIndex, `${source} must precede the homepage fallback`)
    assert.equal(config.rewrites[index].destination, '/beta/index.html')
  }
  assert.equal(config.rewrites.some((rule) => rule.source === '/signup'), false)
})

test('all poster openings arrive prerendered with their own copy, styles and noindex', async () => {
  for (const [campaign, title] of [['general', 'heard you were looking for my number.'], ['career', 'got the interview?'], ['dating', 'first date. third outfit change?']]) {
    const page = await read(`dist/beta/${campaign === 'general' ? '' : `${campaign}/`}index.html`)
    const head = page.slice(0, page.indexOf('</head>'))
    assert.ok(page.includes(`data-campaign="${campaign}"`))
    assert.ok(page.includes(title))
    assert.match(head, /name="robots" content="noindex,follow"/)
    for (const css of betaCss) assert.ok(head.includes(`href="/${css}"`))
    if (campaign !== 'general') assert.doesNotMatch(page, /heard you were looking for my number\./)
  }
})
