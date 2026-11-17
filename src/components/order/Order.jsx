import { useEffect, useState } from 'react'
import ButtonArrow from '../ButtonArrow'
import '../checkout/Checkout.css'
import './Order.css'

export default function Order() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const product = products.find(item => item.id === productId)
  const variant = product?.variants.find(item => item.id === variantId)
  const price = value => new Intl.NumberFormat('en-CA', { style: 'currency', currency: value.currencyCode }).format(Number(value.amount))

  useEffect(() => {
    document.title = 'Order | Oro'
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch('/api/order', { signal: controller.signal }).then(async response => {
      const data = await response.json().catch(() => { throw new Error('Unable to load products. The order API did not return JSON. Please restart the development server.') })
      if (!response.ok) throw new Error(data.error)
      setProducts(data.products)
    }).catch(failure => {
      if (!controller.signal.aborted) setError(failure.message || 'Unable to load products. Please try again.')
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [attempt])

  async function checkout(event) {
    event.preventDefault()
    if (busy || !variant?.availableForSale) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variantId }) })
      const data = await response.json().catch(() => { throw new Error('Unable to open checkout. Please try again shortly.') })
      if (!response.ok) throw new Error(data.error)
      const url = new URL(data.checkoutUrl)
      if (url.protocol !== 'https:') throw new Error('Unable to open checkout. Please try again.')
      window.location.assign(url.href)
    } catch (failure) {
      setError(failure.message || 'Unable to open checkout. Please try again.')
      setBusy(false)
    }
  }

  return <div className="checkout-page order-page halo-container">
    <header className="checkout-story"><p>From Oro, to you.</p><h1>Pick your <em>favourite.</em></h1><p>Two choices. A little more Oro in your everyday.</p></header>
    <p role="status">{loading ? 'Loading products…' : busy ? 'Opening Shopify checkout…' : error}</p>
    {!loading && !products.length && <button className="oro-button" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
    {!!products.length && <form onSubmit={checkout}>
      <fieldset disabled={busy} className="order-products"><legend>Choose one item</legend>
        {products.map(item => <label className="checkout-card order-product" key={item.id}>
          <input type="radio" name="product" value={item.id} checked={productId === item.id} onChange={() => {
            setProductId(item.id)
            setVariantId(item.variants.length === 1 && item.variants[0].availableForSale ? item.variants[0].id : '')
            setError('')
          }} />
          {item.featuredImage && <img src={item.featuredImage.url} alt={item.featuredImage.altText || item.title} />}
          <h2>{item.title}</h2><p>{item.description}</p>
          <p>{item.variants.length > 1 ? 'From ' : ''}{item.variants.length ? price(item.variants.reduce((lowest, option) => Number(option.price.amount) < Number(lowest.price.amount) ? option : lowest).price) : 'Unavailable'}</p>
          {!item.variants.some(option => option.availableForSale) && <p>Sold out</p>}
        </label>)}
      </fieldset>
      <div className="checkout-card order-summary">
        <h2>Your selection</h2>
        {product ? <>
          <p>{product.title}</p>
          {product.variants.length > 1 && <><label className="checkout-label" htmlFor="order-variant">Choose an option</label>
            <select className="oro-input" id="order-variant" value={variantId} disabled={busy} onChange={event => setVariantId(event.target.value)}>
              <option value="">Select an option</option>
              {product.variants.map(option => <option key={option.id} value={option.id} disabled={!option.availableForSale}>{option.title} — {price(option.price)}{!option.availableForSale ? ' (sold out)' : ''}</option>)}
            </select></>}
          {variant && <p>Subtotal: {price(variant.price)} {variant.price.currencyCode}</p>}
        </> : <p>Choose an item above to get started.</p>}
        <p>One item per order. Shipping and taxes are calculated at checkout.</p>
        <button className="oro-button" type="submit" disabled={busy || !variant?.availableForSale}>Continue to Shopify checkout <ButtonArrow /></button>
        <p>Questions? <a href="/contact">Contact us</a>.</p>
      </div>
    </form>}
  </div>
}
