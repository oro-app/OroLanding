import test from 'node:test'
import assert from 'node:assert/strict'
import handler from '../api/order.js'

test('order restricts checkout to available variants of the two configured products', async () => {
  const previous = { ...process.env }
  const originalFetch = globalThis.fetch
  process.env.SHOPIFY_STORE_DOMAIN = 'oro-test.myshopify.com'
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN = 'test-token'
  process.env.SHOPIFY_ORDER_PRODUCT_HANDLES = 'one,two'
  const calls = []
  globalThis.fetch = async (url, options) => {
    const body = JSON.parse(options.body)
    calls.push(body)
    return { ok: true, json: async () => ({ data: body.query.includes('cartCreate')
      ? { cartCreate: { cart: { checkoutUrl: 'https://oro-test.myshopify.com/checkouts/test' }, userErrors: [] } }
      : { product: { id: body.variables.handle, variants: { nodes: [{ id: `${body.variables.handle}-variant`, availableForSale: body.variables.handle === 'one' }], pageInfo: { hasNextPage: false } } } } }) }
  }
  const request = async (method, body) => {
    const res = { setHeader() {}, status(value) { this.code = value; return this }, json(value) { this.data = value; return this } }
    await handler({ method, body }, res)
    return res
  }
  try {
    assert.equal((await request('GET')).data.products.length, 2)
    assert.equal((await request('POST', { variantId: 'unlisted-variant' })).code, 400)
    assert.equal((await request('POST', { variantId: 'two-variant' })).code, 400)
    assert.equal(calls.filter(call => call.query.includes('cartCreate')).length, 0)
    assert.equal((await request('POST', { variantId: 'one-variant', quantity: 100, price: 0 })).code, 200)
    assert.deepEqual(calls.at(-1).variables.input.lines, [{ merchandiseId: 'one-variant', quantity: 1 }])
    assert.equal((await request('DELETE')).code, 405)
    process.env.SHOPIFY_STORE_DOMAIN = 'untrusted.example'
    assert.equal((await request('GET')).code, 503)
  } finally {
    globalThis.fetch = originalFetch
    for (const key of ['SHOPIFY_STORE_DOMAIN', 'SHOPIFY_STOREFRONT_ACCESS_TOKEN', 'SHOPIFY_ORDER_PRODUCT_HANDLES']) {
      if (previous[key] === undefined) delete process.env[key]
      else process.env[key] = previous[key]
    }
  }
})
