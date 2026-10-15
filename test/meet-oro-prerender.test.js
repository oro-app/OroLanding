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
  const video = html.match(/<video\b[^>]*>/)?.[0] || ''
  for (const attribute of ['autoPlay', 'muted', 'playsInline', 'controls']) {
    assert.match(video, new RegExp(`\\b${attribute}(?:=|\\s|>)`, 'i'))
  }
  assert.match(video, /preload="auto"/)
  assert.match(html, /meet-oro--immersive/)
  assert.match(html, /aria-label="skip video and continue to checkout"/)
  assert.doesNotMatch(html, /<(?:header|footer)\b/)
  assert.doesNotMatch(html, /cookie-consent-wrap/)
})


test('the public demo URL resolves to its prerendered document before the SPA fallback', async () => {
  const { rewrites } = JSON.parse(await read('vercel.json'))
  const demoIndex = rewrites.findIndex(rewrite => rewrite.source === '/meet-oro')
  const fallbackIndex = rewrites.findIndex(rewrite => rewrite.destination === '/index.html')
  assert.ok(demoIndex >= 0, 'The bare CTA URL must serve its own prerendered document')
  assert.equal(rewrites[demoIndex].destination, '/meet-oro/index.html')
  assert.ok(fallbackIndex > demoIndex, 'The demo rewrite must precede the general SPA fallback')
})

test('checkout arrives with its styles and prerendered document already available', async () => {
  const html = await read('dist/checkout/index.html')
  const manifest = JSON.parse(await read('dist/.vite/manifest.json'))
  const styles = Object.values(manifest).find(entry => entry.src === 'src/components/checkout/Checkout.jsx' || entry.name === 'Checkout')?.css || []
  assert.ok(styles.length)
  const head = html.slice(0, html.indexOf('</head>'))
  for (const asset of styles) assert.ok(head.includes(`href="/${asset}"`))
  assert.match(html, /oro-checkout-route/)
  const { rewrites } = JSON.parse(await read('vercel.json'))
  const checkoutIndex = rewrites.findIndex(rewrite => rewrite.source === '/checkout')
  assert.ok(checkoutIndex >= 0)
  assert.equal(rewrites[checkoutIndex].destination, '/checkout/index.html')
  assert.ok(checkoutIndex < rewrites.findIndex(rewrite => rewrite.destination === '/index.html'))
})
