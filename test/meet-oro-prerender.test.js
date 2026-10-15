import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')

test('the prerendered demo loads its route styles before JavaScript', async () => {
  const html = await read('dist/meet-oro/index.html')
  const manifest = JSON.parse(await read('dist/.vite/manifest.json'))
  const routeStyles = manifest['src/components/meet-oro/MeetOro.jsx']?.css || []
  assert.ok(routeStyles.length, 'Build first; the product demo route must emit CSS')
  const head = html.slice(0, html.indexOf('</head>'))
  const stylesheetHrefs = [...head.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(match => match[1])
  for (const asset of routeStyles) {
    assert.ok(stylesheetHrefs.includes(`/${asset}`), `${asset} must be linked before the prerendered demo paints`)
    assert.ok((await read(`dist/${asset}`)).length > 0)
  }
  assert.equal([...html.matchAll(/<video\b/g)].length, 1)
  assert.match(html, /src="\/demos\/oro-onboarding-demo\.mp4"/)
  assert.equal([...html.matchAll(/type="checkbox"/g)].length, 0)
  assert.ok(!html.includes('what’s the hardest part'))
  assert.ok(html.includes('href="/checkout"'))
})
