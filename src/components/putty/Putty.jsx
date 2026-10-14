import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import { formatPrice, stripeAppearance } from '../../lib/checkout'
import { cents, hoodieSpots, puttyRequest, readPuttyOrder, savePuttyOrder } from '../../lib/putty'
import { useTheme } from '../../context/ThemeContext'
import HoodieViewer from './HoodieViewer'
import PuttyPayment from './PuttyPayment'
import '../checkout/Checkout.css'
import './Putty.css'

export default function Putty() {
  const { theme } = useTheme()
  const [board, setBoard] = useState(null)
  const [selected, setSelected] = useState({})
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [quote, setQuote] = useState(null)
  const [order, setOrder] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [boardError, setBoardError] = useState('')
  const [now, setNow] = useState(Date.now)
  const [consent, setConsent] = useState(false)
  const [checkingSpot, setCheckingSpot] = useState(null)
  const selecting = useRef(false)
  const boardRequest = useRef(0)
  const submitting = useRef(false)
  const mounted = useRef(true)
  const stripe = useMemo(() => order?.publishable_key ? loadStripe(order.publishable_key) : null, [order?.publishable_key])
  const options = useMemo(() => ({ clientSecret: order?.client_secret,
    elementsOptions: { appearance: stripeAppearance() },
  }), [order?.client_secret, theme])
  const refresh = useCallback(async (signal) => {
    const request = ++boardRequest.current
    try {
      const data = await puttyRequest('board', undefined, signal)
      if (!signal?.aborted && mounted.current && request === boardRequest.current) { setBoard(data); setBoardError('') }
      return data
    } catch (failure) {
      if (!signal?.aborted && mounted.current && request === boardRequest.current) setBoardError('Live availability is unavailable. Please try selecting a square again shortly.')
      return null
    }
  }, [])
  const acceptOrder = useCallback(data => {
    setOrder(data)
    setOrderId(data.order_id)
    savePuttyOrder(data.order_id)
    refresh()
  }, [refresh])

  useEffect(() => {
    mounted.current = true
    document.title = 'Merch — claim a piece of the hoodie | Oro'
    const id = readPuttyOrder()
    if (id) setOrderId(id)
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => { mounted.current = false; clearInterval(timer) }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    const timer = setInterval(() => refresh(controller.signal), 10000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [refresh])

  useEffect(() => {
    if (!orderId || (order && order.status !== 'pending')) return
    const controller = new AbortController()
    let timer
    async function check() {
      try {
        const data = await puttyRequest('status', { order_id: orderId }, controller.signal)
        if (controller.signal.aborted) return
        acceptOrder(data)
        setError('')
        if (data.status === 'pending') timer = setTimeout(check, 5000)
      } catch (failure) {
        if (!controller.signal.aborted) {
          setError(failure.message)
          if (failure.status === 404) { setOrderId(null); savePuttyOrder(null) }
          else timer = setTimeout(check, 10000)
        }
      }
    }
    check()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [orderId, order?.status, acceptOrder])

  const locked = busy || Boolean(orderId) || Boolean(checkingSpot)
  const spots = hoodieSpots(board)
  const count = Object.keys(selected).length
  const seconds = order ? Math.max(0, Math.ceil((Date.parse(order.hold_until) - now) / 1000)) : 0

  async function toggle(spot) {
    if (locked || selecting.current) return
    setQuote(null)
    if (spot.id in selected) {
      setSelected(previous => { const next = { ...previous }; delete next[spot.id]; return next })
      return
    }
    selecting.current = true
    setCheckingSpot(spot.id)
    setError('')
    try {
      const current = await refresh()
      if (!mounted.current) return
      if (!current) return
      const fresh = current.spots.find(item => item.id === spot.id)
      if (!current.enabled) { setError('Bidding is not open yet.'); return }
      if (!fresh || fresh.held) { setError('This placement is held for another payment. Please choose another square or try again shortly.'); return }
      setSelected(previous => ({ ...previous, [spot.id]: (fresh.minimum / 100).toFixed(2) }))
    } finally { selecting.current = false; if (mounted.current) setCheckingSpot(null) }
  }

  async function review(event) {
    event.preventDefault()
    if (submitting.current || !count || !consent || locked) return
    submitting.current = true
    setBusy(true)
    setError('')
    const items = Object.entries(selected).map(([spot_id, value]) => ({ spot_id, total: cents(value) }))
    try {
      if (items.some(item => item.total === null)) throw new Error('Enter a price with no more than two decimal places for each square.')
      const data = await puttyRequest('quote', { email, display_name: name, items, terms_accepted: consent })
      setQuote(data)
    } catch (failure) { setError(failure.message); refresh() }
    finally { submitting.current = false; setBusy(false) }
  }

  async function begin() {
    if (submitting.current || !consent || !quote || locked) return
    submitting.current = true
    setBusy(true)
    setError('')
    const id = crypto.randomUUID()
    const request = { order_id: id, email, display_name: name, terms_accepted: consent,
      items: quote.items.map(({ spot_id, total }) => ({ spot_id, total })) }
    savePuttyOrder(id)
    try {
      const data = await puttyRequest('checkout', request)
      acceptOrder(data)
    } catch (failure) {
      setError(failure.message)
      try { acceptOrder(await puttyRequest('status', { order_id: id })) }
      catch (statusFailure) {
        if (statusFailure.status === 404) { savePuttyOrder(null); setQuote(null); refresh() }
        else setOrderId(id)
      }
    } finally { submitting.current = false; setBusy(false) }
  }

  async function check(cancel = false) {
    setBusy(true)
    setError('')
    try { acceptOrder(await puttyRequest(cancel ? 'cancel' : 'status', { order_id: orderId })) }
    catch (failure) { setError(failure.message) }
    finally { setBusy(false) }
  }

  function reset() {
    savePuttyOrder(null)
    setOrderId(null)
    setOrder(null)
    setQuote(null)
    setSelected({})
    setError('')
    refresh()
  }

  return <div className="checkout-page putty-page halo-container">
    <div className="putty-intro">
      <h1>Make your <em>mark.</em></h1>
      <p>Your name, on our hoodie. Back squares from $10. Front placement from $500.</p>
    </div>
    <div className="putty-layout">
      <section aria-label="Choose hoodie placements" className="putty-preview">
        <HoodieViewer spots={spots} selected={selected} locked={locked} checking={checkingSpot} onSelect={toggle} />
        <p role="status" className="putty-availability">{checkingSpot ? `Checking ${checkingSpot}…` : boardError || (!board ? 'Checking availability…' : !board.enabled ? 'Bidding is not open yet.' : '')}</p>
      </section>
      <section className="checkout-card putty-card" aria-labelledby="putty-bid-heading">
        <h2 id="putty-bid-heading">{order?.status === 'paid' ? 'You made your mark.' : 'Claim your space.'}</h2>
        <p role="alert" className="checkout-error">{error}</p>
        {orderId ? <>
          {order?.status === 'paid' ? <>
            <p role="status">Payment confirmed. Your bid claimed {order.items.map(i => i.spot_id).join(', ')}.</p>
            <p>Someone can still outbid you. We’ll handle any follow-up personally.</p>
            <button className="oro-button" onClick={reset}>Choose more squares</button>
          </> : order?.status === 'expired' ? <>
            <p role="status">Your hold expired. Choose your squares again to check the latest bids.</p>
            <button className="oro-button" onClick={reset}>Choose squares again</button>
          </> : <>
            <p role="status">{order ? 'Your squares are held while you pay.' : 'Checking your checkout. Please wait before paying again.'}</p>
            {order && <p className="putty-hold" role="timer">{seconds > 0 ? `${seconds}s left on this hold` : 'Checking payment and releasing any unpaid hold…'}</p>}
            {order?.client_secret && stripe && <CheckoutElementsProvider key={order.order_id} stripe={stripe} options={options}>
              <PuttyPayment order={order} onStatus={acceptOrder} />
            </CheckoutElementsProvider>}
            <div className="putty-order-actions">
              <button onClick={() => check()} disabled={busy}>Check payment status</button>
              <button onClick={() => check(true)} disabled={busy}>Cancel hold</button>
            </div>
          </>}
        </> : <form onSubmit={review}>
          <p role="status">{count ? `${count} ${count === 1 ? 'placement' : 'placements'} selected` : 'Select a square on the hoodie to begin.'}</p>
          <fieldset disabled={locked} className="putty-bids">
            <legend>Your price</legend>
            {Object.entries(selected).map(([id, value]) => {
              const spot = spots.find(s => s.id === id)
              return <div key={id} className="putty-bid-row">
                <label htmlFor={`bid-${id}`}>{id === 'front' ? 'Front left chest' : `Square ${id}`}<small>{spot?.name ? `${spot.name} · ${formatPrice(spot.total)}` : 'Unclaimed'}</small></label>
                <div className="putty-price"><span aria-hidden="true">$</span><input id={`bid-${id}`} type="text" inputMode="decimal" required value={value}
                  aria-describedby={`minimum-${id}`} onChange={event => { setQuote(null); setSelected(old => ({ ...old, [id]: event.target.value })) }} /></div>
                <button type="button" aria-label={`Remove ${id}`} onClick={() => toggle(spot)}>×</button>
                <small id={`minimum-${id}`} className="putty-minimum">Minimum {formatPrice(spot?.minimum || 0)}</small>
              </div>
            })}
          </fieldset>
          <label className="checkout-label" htmlFor="putty-email">Email</label>
          <input className="oro-input" id="putty-email" type="email" autoComplete="email" maxLength={254} required disabled={locked}
            value={email} onChange={event => { setEmail(event.target.value); setQuote(null) }} aria-describedby="putty-credit-note" />
          <p className="putty-note" id="putty-credit-note">Bought before? Use the same email. Your total includes previous payments on each square; you only pay the difference.</p>
          <label className="checkout-label" htmlFor="putty-name">Display name <span>(optional)</span></label>
          <input className="oro-input" id="putty-name" autoComplete="nickname" maxLength={60} disabled={locked} value={name}
            onChange={event => { setName(event.target.value); setQuote(null) }} placeholder="Your name on the hoodie grid" aria-describedby="putty-name-note" />
          <p className="putty-note" id="putty-name-note">Shown on your squares. Leave blank for “Anonymous”. Existing paid names stay the same.</p>
          <p className="putty-note">Being outbid doesn’t automatically refund your payment.</p>
          <label className="putty-consent">
            <input type="checkbox" required checked={consent} disabled={locked} onChange={event => { setConsent(event.target.checked); setQuote(null) }} />
            <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.</span>
          </label>
          {quote ? <div className="putty-summary">
            <p>Previous payments applied <strong>{formatPrice(quote.items.reduce((sum, item) => sum + item.credit, 0))}</strong></p>
            <p>Due now <strong>{formatPrice(quote.amount)} USD</strong></p>
            <button type="button" className="oro-button oro-button--primary checkout-button" onClick={begin} disabled={locked || !consent}>Continue to payment ↗</button>
            <p className="putty-note">We’ll recheck every square and hold them for one minute. Payment opens right here.</p>
          </div> : <button type="submit" className="oro-button oro-button--primary checkout-button" disabled={locked || !count || !board?.enabled}>{busy ? 'Checking your bid…' : 'Review my bid ↗'}</button>}
        </form>}
      </section>
    </div>
  </div>
}
