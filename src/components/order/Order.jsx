import { useEffect, useRef, useState } from 'react'
import { Button } from 'oro-kit'
import { hasAnalyticsConsent, trackEvent } from '../../lib/analytics'
import ButtonArrow from '../ButtonArrow'
import { readProductDescription } from './ProductDescription'
import './Order.css'
import './OrderCta.css'

export default function Order() {
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [imageIndex, setImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const viewedVariant = useRef('')
  const product = products.find(item => item.id === productId)
  const variant = product?.variants.find(item => item.id === variantId)
  const images = product?.images?.nodes?.length ? product.images.nodes : product?.featuredImage ? [product.featuredImage] : []
  const image = images[imageIndex]
  const onSale = variant?.compareAtPrice?.currencyCode === variant?.price.currencyCode && Number(variant?.compareAtPrice?.amount) > Number(variant?.price.amount)
  const price = value => new Intl.NumberFormat('en-CA', { style: 'currency', currency: value.currencyCode }).format(Number(value.amount))

  useEffect(() => {
    function resetCheckout() { setBusy(false) }
    window.addEventListener('pageshow', resetCheckout)
    return () => window.removeEventListener('pageshow', resetCheckout)
  }, [])

  function trackOrderEvent(name, item = product, option = variant, params = {}) {
    trackEvent(name, {
      route_type: 'order',
      ...(option && { currency: option.price.currencyCode, value: Number(option.price.amount), items: [{ item_id: item.id, item_name: item.title, item_variant: option.title, price: Number(option.price.amount), quantity: 1 }] }),
      ...params,
    })
  }

  function selectProduct(item, track = false) {
    const option = item.variants.find(option => option.availableForSale) || item.variants[0]
    setProductId(item.id)
    setVariantId(option?.id || '')
    setImageIndex(0)
    setError('')
    if (track) trackOrderEvent('select_item', item, option, { item_list_id: 'order_styles', item_list_name: 'Order styles' })
  }

  useEffect(() => {
    function trackView() {
      if (!variant || !hasAnalyticsConsent() || viewedVariant.current === variant.id) return
      trackOrderEvent('view_item')
      viewedVariant.current = variant.id
    }
    trackView()
    window.addEventListener('oro:analytics-consent-change', trackView)
    return () => window.removeEventListener('oro:analytics-consent-change', trackView)
  }, [product, variant])

  useEffect(() => {
    document.title = 'Order | Oro'
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch('/api/order', { signal: controller.signal }).then(async response => {
      const data = await response.json().catch(() => { throw new Error('Unable to load products. The order API did not return JSON. Please restart the development server.') })
      if (!response.ok) throw new Error(data.error)
      for (const item of data.products) {
        if (!item.descriptionHtml) continue
        item.descriptionContent = readProductDescription(item.descriptionHtml)
      }
      setProducts(data.products)
      if (data.products.length) selectProduct(data.products.find(item => item.variants.some(option => option.availableForSale)) || data.products[0])
    }).catch(failure => {
      if (!controller.signal.aborted) {
        setError(failure.message || 'Unable to load products. Please try again.')
        trackOrderEvent('order_load_error')
      }
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
      trackOrderEvent('begin_checkout', product, variant, { transport_type: 'beacon' })
      window.location.assign(url.href)
    } catch (failure) {
      trackOrderEvent('order_checkout_error')
      setError(failure.message || 'Unable to open checkout. Please try again.')
      setBusy(false)
    }
  }

  return <div className="order-page halo-container">
    <section className="order-content" aria-label="Pre-order products">
    {!product && <h1 className={loading ? 'order-sr-only' : undefined}>Pre-order</h1>}
    <p className={`order-status${loading ? ' order-sr-only' : ''}`} role="status">{loading ? 'Loading products…' : error}</p>
    {loading && <div className="order-layout order-skeleton" aria-hidden="true">
      <div className="order-gallery">
        <div className="order-thumbnails">{[0, 1, 2].map(index => <span className="order-thumbnail order-skeleton-block" key={index} />)}</div>
        <div className="order-preview order-skeleton-block" />
      </div>
      <div className="order-details">
        <span className="order-skeleton-title order-skeleton-block" />
        <span className="order-skeleton-price order-skeleton-block" />
        {[0, 1, 2].map(index => <span className="order-skeleton-line order-skeleton-block" key={index} />)}
        <span className="order-skeleton-options order-skeleton-block" />
        <span className="order-skeleton-button order-skeleton-block" />
      </div>
    </div>}
    {!loading && !products.length && <button className="oro-button" onClick={() => setAttempt(value => value + 1)}>Try again</button>}
    {product && <form className="order-layout" onSubmit={checkout}>
      <section className="order-gallery" aria-label={`${product.title} photos`}>
        {images.length > 1 && <div className="order-thumbnails" role="group" aria-label="Product photos">
          {images.map((photo, index) => <button type="button" key={photo.url} className="order-thumbnail" aria-label={`View ${product.title} photo ${index + 1}`} aria-pressed={imageIndex === index} onClick={() => { setImageIndex(index); trackOrderEvent('order_image_select', product, variant, { image_index: index + 1 }) }}>
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
          <span><span className="order-sr-only">{onSale ? 'Sale price: ' : 'Price: '}</span>{price(variant.price)}</span>
          {onSale && <del><span className="order-sr-only">Regular price: </span>{price(variant.compareAtPrice)}</del>}
        </div>}
        <div className="order-description">{product.descriptionContent || <p className="order-description-plain">{product.description}</p>}</div>
        <fieldset disabled={busy} className="order-options"><legend>Style</legend>
          <div className="order-option-list">{products.map(item => <label className="order-option order-option--image" key={item.id}>
            <input type="radio" name="product" value={item.id} checked={productId === item.id} onChange={() => selectProduct(item, true)} />
            <span>
              {item.images?.nodes?.[0] || item.featuredImage ? <img src={(item.images?.nodes?.[0] || item.featuredImage).url} alt={`${item.title}${!item.variants.some(option => option.availableForSale) ? ' (sold out)' : ''}`} /> : item.title}
            </span>
          </label>)}</div>
        </fieldset>
        {product.variants.length > 1 && <fieldset disabled={busy} className="order-options"><legend>Sizes</legend>
          <div className="order-option-list">{product.variants.map(option => <label className="order-option order-option--size" key={option.id}>
            <input type="radio" name="variant" value={option.id} checked={variantId === option.id} disabled={!option.availableForSale} onChange={() => { setVariantId(option.id); setError(''); trackOrderEvent('select_variant', product, option) }} />
            <span>{option.title}{!option.availableForSale && ' (sold out)'}</span>
          </label>)}</div>
        </fieldset>}
        <Button variant="primary" className="order-checkout oro-cta--compact" type="submit" disabled={busy || !variant?.availableForSale}><span>{busy ? 'Opening checkout…' : variant?.availableForSale ? 'Pre-order' : 'Sold out'}</span> <ButtonArrow /></Button>
      </div>
    </form>}
    </section>
    <p className="order-contact">Questions about your pre-order? <a href="/contact">Contact us</a></p>
  </div>
}
