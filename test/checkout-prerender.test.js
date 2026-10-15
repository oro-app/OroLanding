import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const root = new URL('../', import.meta.url)
const read = path => readFile(new URL(path, root), 'utf8')

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
