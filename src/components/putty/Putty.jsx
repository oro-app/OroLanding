import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import { formatPrice, stripeAppearance } from '../../lib/checkout'
import { cents, puttyRequest, readPuttyOrder, savePuttyOrder } from '../../lib/putty'
import { useTheme } from '../../context/ThemeContext'
import front from '../../assets/blanks/front.webp'
import back from '../../assets/blanks/back.webp'
import PuttyPayment from './PuttyPayment'
import '../checkout/Checkout.css'
import './Putty.css'

export default function Putty() {
  const { theme } = useTheme()
  const [side, setSide] = useState('back')
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
  const [autoRefresh, setAutoRefresh] = useState(true)
  const submitting = useRef(false)
  const mounted = useRef(true)
  const stripe = useMemo(() => order?.publishable_key ? loadStripe(order.publishable_key) : null, [order?.publishable_key])
  const options = useMemo(() => ({ clientSecret: order?.client_secret,
    elementsOptions: { appearance: stripeAppearance() },
  }), [order?.client_secret, theme])
  const refresh = useCallback(async (signal) => {
    try {
      const data = await puttyRequest('board', undefined, signal)
      if (!signal?.aborted && mounted.current) { setBoard(data); setBoardError('') }
    } catch (failure) { if (!signal?.aborted && mounted.current) setBoardError(failure.message) }
  }, [])
  const acceptOrder = useCallback(data => {
    setOrder(data)
    setOrderId(data.order_id)
    savePuttyOrder(data.order_id)
    refresh()
  }, [refresh])

  useEffect(() => {
    mounted.current = true
    document.title = 'Putty — claim a piece of the hoodie | Oro'
    const id = readPuttyOrder()
    if (id) setOrderId(id)
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => { mounted.current = false; clearInterval(timer) }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    const timer = autoRefresh ? setInterval(() => refresh(controller.signal), 10000) : null
    return () => { controller.abort(); clearInterval(timer) }
  }, [autoRefresh, refresh])

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

  const locked = busy || Boolean(orderId)
  const spots = board?.spots || []
  const visible = spots.filter(spot => side === 'front' ? spot.id === 'front' : spot.id !== 'front')
  const count = Object.keys(selected).length
  const seconds = order ? Math.max(0, Math.ceil((Date.parse(order.hold_until) - now) / 1000)) : 0

  function toggle(spot) {
    setQuote(null)
    setSelected(previous => {
      const next = { ...previous }
      if (spot.id in next) delete next[spot.id]
      else next[spot.id] = (spot.minimum / 100).toFixed(2)
      return next
    })
  }

  async function review(event) {
    event.preventDefault()
    if (submitting.current || !count) return
    submitting.current = true
    setBusy(true)
    setError('')
    const items = Object.entries(selected).map(([spot_id, value]) => ({ spot_id, total: cents(value) }))
    try {
      if (items.some(item => item.total === null)) throw new Error('Enter a price with no more than two decimal places for each square.')
      const data = await puttyRequest('quote', { email, display_name: name, items })
      setQuote(data)
    } catch (failure) { setError(failure.message); refresh() }
    finally { submitting.current = false; setBusy(false) }
  }

  async function begin() {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setError('')
    const id = crypto.randomUUID()
    const request = { order_id: id, email, display_name: name,
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
    <header className="checkout-header putty-header">
      <a href="/" aria-label="Oro home"><img src="/oro-logo.webp" alt="Oro" width="104" height="59" /></a>
      <span>putty / a hoodie by all of us</span>
    </header>
    <div className="putty-intro">
      <p className="putty-eyebrow">a little space. a big statement.</p>
      <h1>Make your <em>mark.</em></h1>
      <p>One hoodie. 48 squares on the back. One special spot up front.<br />Pick your space, place your bid, and make it yours.</p>
    </div>
    <div className="putty-layout">
      <section aria-label="Choose hoodie placements" className="putty-preview">
        <div className="putty-switch" role="group" aria-label="Hoodie view">
          <button type="button" aria-pressed={side === 'back'} onClick={() => setSide('back')}>Back · from $10</button>
          <button type="button" aria-pressed={side === 'front'} onClick={() => setSide('front')}>Front · from $500</button>
        </div>
        <p className="putty-note">{side === 'back' ? '6 columns × 8 rows. Select as many squares as you like.' : 'One placement on the wearer’s left chest.'}</p>
        <div className="putty-canvas-scroll" tabIndex={0} role="region" aria-label="Hoodie image and selectable squares; scroll horizontally on smaller screens">
          <div className="putty-canvas">
            <img src={side === 'back' ? back : front} alt={`Black hoodie, ${side} view`} width="800" height="1200" />
            <div className={`putty-grid putty-grid--${side}`}>
              {visible.map(spot => <button key={spot.id} type="button"
                className="putty-square" aria-pressed={spot.id in selected}
                disabled={locked || !board?.enabled || (spot.held && !(spot.id in selected))}
                aria-label={`${spot.id === 'front' ? 'Front left chest' : spot.id}: ${spot.name ? `${spot.name}, current bid ${formatPrice(spot.total)}` : 'Unclaimed'}, minimum ${formatPrice(spot.minimum)} USD${spot.held ? ', payment in progress' : ''}`}
                onClick={() => toggle(spot)}>
                <span>{spot.id in selected ? '✓ ' : ''}{spot.id === 'front' ? 'left chest' : spot.id}</span>
                <small>{spot.held ? 'held' : spot.name || '+'}</small>
              </button>)}
            </div>
          </div>
        </div>
        <p className="putty-note">Names mark paid claims. You can still outbid them. ✓ means selected.</p>
        <div className="putty-refresh">
          <label><input type="checkbox" checked={autoRefresh} onChange={event => setAutoRefresh(event.target.checked)} /> Update availability automatically</label>
          <button type="button" onClick={() => refresh()}>Refresh squares</button>
        </div>
        <p role="status">{!board && !boardError ? 'Loading squares…' : boardError || (!board.enabled ? 'Bidding is not open yet.' : '')}</p>
      </section>
      <section className="checkout-card putty-card" aria-labelledby="putty-bid-heading">
        <p className="putty-eyebrow">your piece of putty</p>
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
            <legend>Your total bid per placement (USD)</legend>
            {Object.entries(selected).map(([id, value]) => {
              const spot = spots.find(s => s.id === id)
              return <div key={id} className="putty-bid-row">
                <label htmlFor={`bid-${id}`}>{id === 'front' ? 'Front left chest' : `Square ${id}`}<small>{spot?.name ? `${spot.name} · ${formatPrice(spot.total)}` : 'Unclaimed'}</small></label>
                <div className="putty-price"><span aria-hidden="true">$</span><input id={`bid-${id}`} type="text" inputMode="decimal" required value={value}
                  aria-describedby={`minimum-${id}`} onChange={event => { setQuote(null); setSelected(old => ({ ...old, [id]: event.target.value })) }} /></div>
                <button type="button" aria-label={`Remove ${id}`} onClick={() => toggle(spot)}>×</button>
                <small id={`minimum-${id}`} className="putty-minimum">Minimum {formatPrice(spot?.minimum || 0)} USD</small>
              </div>
            })}
          </fieldset>
          <label className="checkout-label" htmlFor="putty-email">Email</label>
          <input className="oro-input" id="putty-email" type="email" autoComplete="email" maxLength={254} required disabled={locked}
            value={email} onChange={event => { setEmail(event.target.value); setQuote(null) }} aria-describedby="putty-credit-note" />
          <p className="putty-note" id="putty-credit-note">Bought before? Use the same email. Your previous payments on each square count toward your bid, so you only pay the difference. No verification needed.</p>
          <label className="checkout-label" htmlFor="putty-name">Display name <span>(optional)</span></label>
          <input className="oro-input" id="putty-name" autoComplete="nickname" maxLength={60} disabled={locked} value={name}
            onChange={event => { setName(event.target.value); setQuote(null) }} placeholder="Your name on the hoodie grid" aria-describedby="putty-name-note" />
          <p className="putty-note" id="putty-name-note">This name is public. Leave it blank to appear as “Anonymous”. Your email stays private. Returning to a square? Its original paid display name stays.</p>
          <p className="putty-note">Bids are paid contributions. Being outbid doesn’t automatically refund your payment. No artwork is needed today; we’ll follow up about your placement.</p>
          {quote ? <div className="putty-summary">
            <p>Previous payments applied <strong>{formatPrice(quote.items.reduce((sum, item) => sum + item.credit, 0))}</strong></p>
            <p>Due now <strong>{formatPrice(quote.amount)} USD</strong></p>
            <button type="button" className="oro-button oro-button--primary checkout-button" onClick={begin} disabled={locked}>Hold squares & continue to payment ↗</button>
            <p className="putty-note">We’ll recheck every square and hold them for one minute. Payment opens right here.</p>
          </div> : <button type="submit" className="oro-button oro-button--primary checkout-button" disabled={locked || !count || !board?.enabled}>{busy ? 'Checking your bid…' : 'Review my bid ↗'}</button>}
        </form>}
      </section>
    </div>
  </div>
}
