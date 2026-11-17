import { useEffect, useState } from 'react'
import ButtonArrow from '../ButtonArrow'
import './Order.css'

export default function Order() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const product = products.find(item => item.id === productId)
  const variant = product?.variants.find(item => item.id === variantId)
  const images = product?.images?.nodes?.length ? product.images.nodes : product?.featuredImage ? [product.featuredImage] : []
  const image = images[imageIndex]
  const onSale = variant?.compareAtPrice?.currencyCode === variant?.price.currencyCode && Number(variant?.compareAtPrice?.amount) > Number(variant?.price.amount)
  const price = value => new Intl.NumberFormat('en-CA', { style: 'currency', currency: value.currencyCode }).format(Number(value.amount))

  function selectProduct(item) {
    setProductId(item.id)
    setVariantId((item.variants.find(option => option.availableForSale) || item.variants[0])?.id || '')
    setImageIndex(0)
    setError('')
  }

  useEffect(() => {
    document.title = 'Order | Oro'
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch('/api/order', { signal: controller.signal }).then(async response => {
      const data = await response.json().catch(() => { throw new Error('Unable to load products. The order API did not return JSON. Please restart the development server.') })
      if (!response.ok) throw new Error(data.error)
      setProducts(data.products)
      if (data.products.length) selectProduct(data.products.find(item => item.variants.some(option => option.availableForSale)) || data.products[0])
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

  return <div className="order-page halo-container">
    {!product && <h1>Pre-order</h1>}
    <p className="order-status" role="status">{loading ? 'Loading products…' : busy ? 'Opening Shopify checkout…' : error}</p>
    {!loading && !products.length && <button className="oro-button" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
    {product && <form className="order-layout" onSubmit={checkout}>
      <section className="order-gallery" aria-label={`${product.title} photos`}>
        {images.length > 1 && <div className="order-thumbnails" role="group" aria-label="Product photos">
          {images.map((photo, index) => <button type="button" key={photo.url} className="order-thumbnail" aria-label={`View ${product.title} photo ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)}>
            <img src={photo.url} alt="" loading="lazy" />
          </button>)}
        </div>}
        <div className="order-preview">
          {image ? <img src={image.url} alt={image.altText || `${product.title} — photo ${imageIndex + 1}`} /> : <p>Product photos coming soon.</p>}
        </div>
      </section>
      <div className="order-details">
        <h1>{product.title}</h1>
        {variant && <div className="order-price">
          {onSale && <del><span className="order-sr-only">Regular price: </span>{price(variant.compareAtPrice)}</del>}
          <span><span className="order-sr-only">{onSale ? 'Sale price: ' : 'Price: '}</span>{price(variant.price)}</span>
          <small>{variant.price.currencyCode}</small>
          {onSale && <span className="order-sale">Save {price({ ...variant.price, amount: Number(variant.compareAtPrice.amount) - Number(variant.price.amount) })}</span>}
        </div>}
        <p className="order-description">{product.description}</p>
        <fieldset disabled={busy} className="order-options"><legend>Style</legend>
          <div className="order-option-list">{products.map(item => <label className="order-option" key={item.id}>
            <input type="radio" name="product" value={item.id} checked={productId === item.id} onChange={() => selectProduct(item)} />
            <span>{item.title}{!item.variants.some(option => option.availableForSale) && ' (sold out)'}</span>
          </label>)}</div>
        </fieldset>
        {product.variants.length > 1 && <fieldset disabled={busy} className="order-options"><legend>Option</legend>
          <div className="order-option-list">{product.variants.map(option => <label className="order-option" key={option.id}>
            <input type="radio" name="variant" value={option.id} checked={variantId === option.id} disabled={!option.availableForSale} onChange={() => { setVariantId(option.id); setError('') }} />
            <span>{option.title}{!option.availableForSale && ' (sold out)'}</span>
          </label>)}</div>
        </fieldset>}
        <button className="oro-button order-checkout" type="submit" disabled={busy || !variant?.availableForSale}>{busy ? 'Opening checkout…' : variant?.availableForSale ? 'Pre-order' : 'Sold out'} <ButtonArrow /></button>
        <p className="order-fineprint">One item per order. Shipping and taxes calculated at checkout.</p>
        <a className="order-contact" href="/contact">Questions about your pre-order? Contact us</a>
      </div>
    </form>}
  </div>
}
