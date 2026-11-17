async function storefront(query, variables, timeout = 10000) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(domain || '') || !process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) throw new Error('configuration')
  const response = await fetch(`https://${domain}/api/2026-10/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN },
    body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(timeout),
  })
  const result = await response.json()
  if (!response.ok || result.errors || !result.data) throw new Error('shopify')
  return result.data
}

async function products(timeout) {
  const handles = (process.env.SHOPIFY_ORDER_PRODUCT_HANDLES || '').split(',').map(value => value.trim()).filter(Boolean)
  if (handles.length !== 2 || new Set(handles).size !== 2) throw new Error('configuration')
  return Promise.all(handles.map(async handle => {
    const { product } = await storefront(`query($handle: String!) {
      product(handle: $handle) { id title description featuredImage { url altText }
        variants(first: 100) { nodes { id title availableForSale price { amount currencyCode } } pageInfo { hasNextPage } }
      }
    }`, { handle }, timeout)
    if (!product) throw new Error('unpublished')
    if (product.variants.pageInfo.hasNextPage) throw new Error('variants')
    return { ...product, variants: product.variants.nodes }
  }))
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  try {
    const timeout = req.orderDevelopment ? 5000 : 10000
    const catalog = await products(timeout)
    if (req.method === 'GET') return res.status(200).json({ products: catalog })
    const variant = catalog.flatMap(product => product.variants).find(item => item.id === req.body?.variantId)
    if (!variant?.availableForSale) return res.status(400).json({ error: 'This option is unavailable. Choose another option or refresh the page.' })
    const { cartCreate } = await storefront(`mutation($input: CartInput!) {
      cartCreate(input: $input) { cart { checkoutUrl } userErrors { message } }
    }`, { input: { lines: [{ merchandiseId: variant.id, quantity: 1 }] } }, timeout)
    if (cartCreate.userErrors.length || !cartCreate.cart?.checkoutUrl) throw new Error('checkout')
    return res.status(200).json({ checkoutUrl: cartCreate.cart.checkoutUrl })
  } catch (failure) {
    const diagnostic = req.orderDevelopment && {
      configuration: 'Check SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN, and the two comma-separated SHOPIFY_ORDER_PRODUCT_HANDLES in your local .env.',
      unpublished: 'Shopify could not find a configured product. Make both products Active, publish them to the Headless sales channel, and check their handles in .env.',
      variants: 'This product has more than 100 variants, which this order page does not support.',
      shopify: 'Shopify rejected the request. Check that your public Storefront token belongs to this store and has product access.',
      TimeoutError: 'Shopify did not respond within five seconds. Try again.',
    }[failure.name === 'TimeoutError' ? failure.name : failure.message]
    return res.status(503).json({ error: diagnostic || 'Ordering is unavailable right now. Please try again shortly or contact us.' })
  }
}
