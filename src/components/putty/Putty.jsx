import { useCallback, useEffect, useRef, useState } from 'react'
import { formatPrice } from '../../lib/checkout'
import { cents, clearPuttyDraft, hoodieSpots, puttyCheckoutUrl, puttyRequest, readPuttyDraft, readPuttyOrder, savePuttyDraft, savePuttyOrder } from '../../lib/putty'
import HoodieViewer from './HoodieViewer'
import '../checkout/Checkout.css'
import './Putty.css'

export default function Putty() {
  const draft = useRef(readPuttyDraft()).current
  const [board, setBoard] = useState(null)
  const [selected, setSelected] = useState(draft.selected)
  const [email, setEmail] = useState(draft.email)
  const [name, setName] = useState(draft.name)
  const [order, setOrder] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [boardError, setBoardError] = useState('')
  const [now, setNow] = useState(Date.now)
  const [consent, setConsent] = useState(draft.consent)
  const boardRequest = useRef(0)
  const submitting = useRef(false)
  const mounted = useRef(true)
  const refresh = useCallback(async (signal) => {
    const request = ++boardRequest.current
    try {
      const data = await puttyRequest('board', undefined, signal)
      if (!signal?.aborted && mounted.current && request === boardRequest.current) { setBoard(data); setBoardError('') }
      return data
    } catch (failure) {
      if (!signal?.aborted && mounted.current && request === boardRequest.current) setBoardError('Live availability is unavailable. Retrying shortly.')
      return null
    }
  }, [])
  const acceptOrder = useCallback(data => {
    setOrder(data)
    setOrderId(data.order_id)
    savePuttyOrder(data.order_id)
    if (data.status === 'paid') clearPuttyDraft()
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
    savePuttyDraft({ selected, email, name, consent })
  }, [selected, email, name, consent])

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
  const spots = hoodieSpots(board)
  const count = Object.keys(selected).length
  const seconds = order ? Math.max(0, Math.ceil((Date.parse(order.hold_until) - now) / 1000)) : 0
  const checkoutUrl = puttyCheckoutUrl(order?.checkout_url)

  function toggle(spot) {
    if (locked) return
    if (spot.id in selected) {
      setSelected(previous => { const next = { ...previous }; delete next[spot.id]; return next })
      return
    }
    if (!board?.enabled || spot.unknown || spot.held) return
    setError('')
    setSelected(previous => ({ ...previous, [spot.id]: (spot.minimum / 100).toFixed(2) }))
  }

  async function begin(event) {
    event.preventDefault()
    if (submitting.current || !count || !consent || locked) return
    submitting.current = true
    setBusy(true)
    setError('')
    const items = Object.entries(selected).map(([spot_id, value]) => ({ spot_id, total: cents(value) }))
    let id
    try {
      if (items.some(item => item.total === null)) throw new Error('Enter a price with no more than two decimal places for each square.')
      const lowBid = items.find(item => item.total < spots.find(spot => spot.id === item.spot_id)?.minimum)
      if (lowBid) throw new Error(`${lowBid.spot_id === 'front' ? 'Front left chest' : `Square ${lowBid.spot_id}`} must meet its current minimum price.`)
      id = crypto.randomUUID()
      const data = await puttyRequest('checkout', { order_id: id, email, display_name: name, terms_accepted: consent, items })
      const url = puttyCheckoutUrl(data.checkout_url)
      acceptOrder(data)
      if (url) window.location.assign(url)
      else throw new Error('Stripe checkout is unavailable. Please try again.')
    } catch (failure) {
      setError(failure.message)
      if (!id) { refresh(); return }
      try { acceptOrder(await puttyRequest('status', { order_id: id })) }
      catch (statusFailure) {
        if (statusFailure.status === 404) { savePuttyOrder(null); refresh() }
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
    const paid = order?.status === 'paid'
    savePuttyOrder(null)
    setOrderId(null)
    setOrder(null)
    if (paid) {
      setSelected({})
      setEmail('')
      setName('')
      setConsent(false)
    }
    setError('')
    refresh()
  }

  return <div className="checkout-page putty-page halo-container">
    <div className="putty-intro">
      <h1>Make your <em>mark.</em></h1>
      <p>Put whatever you want on the hoodie. Someone took your spot? Outbid them.</p>
    </div>
    <div className="putty-layout">
      <section aria-label="Choose hoodie placements" className="putty-preview">
        <HoodieViewer spots={spots} selected={selected} locked={locked || !board?.enabled} onSelect={toggle} />
        <p role="status" className="putty-availability">{boardError || (!board ? 'Checking availability…' : !board.enabled ? 'Bidding is not open yet.' : '')}</p>
      </section>
      <section className="putty-leaderboard" aria-labelledby="putty-leaderboard-heading">
        <p className="putty-leaderboard-kicker">the ones to beat</p>
        <h2 id="putty-leaderboard-heading">Leaderboard</h2>
        <p>Who has claimed the most space on the hoodie.</p>
        <p className="putty-leaderboard-perk"><strong>Top three get the spotlight.</strong> We will highlight your name here, add a link, and work with you on the details.</p>
        {Array.isArray(board?.leaderboard) ? board.leaderboard.length ? <div className="putty-leaderboard-table" role="region" aria-labelledby="putty-leaderboard-heading" tabIndex="0">
          <table>
            <caption>Current ranking by hoodie placements claimed</caption>
            <thead><tr><th scope="col">Rank</th><th scope="col">Name</th><th scope="col">Paid (USD)</th><th scope="col">Spots held</th></tr></thead>
            <tbody>{board.leaderboard.map((entry, index) => <tr className={index < 3 ? 'putty-leaderboard-top' : undefined} key={`${entry.name}-${index}`}>
              <td><span className="putty-leaderboard-rank"><span aria-hidden="true">{index === 0 ? '♦' : index < 3 ? '★' : ''}</span>{index < 3 ? ['1st', '2nd', '3rd'][index] : index + 1}</span></td>
              <th scope="row">{entry.name}</th>
              <td>{entry.total_paid == null ? '—' : formatPrice(entry.total_paid)}</td>
              <td>{entry.area} {entry.area === 1 ? 'spot' : 'spots'}</td>
            </tr>)}</tbody>
          </table>
        </div> : <p>No one has claimed a placement yet. Be the first.</p> : null}
        <p className="putty-leaderboard-help">Questions about your placement or want your link added? <a href="/contact">Send us a message</a> or <a href="mailto:hello@buildingoro.ca">email us</a>.</p>
      </section>
    </div>
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
            {checkoutUrl && <a className="oro-button oro-button--primary checkout-button" href={checkoutUrl}>Continue in Stripe checkout <span aria-hidden="true">↗</span></a>}
            <div className="putty-order-actions">
              <button onClick={() => check()} disabled={busy}>Check payment status</button>
              <button onClick={() => check(true)} disabled={busy}>Cancel hold</button>
            </div>
          </>}
        </> : <form onSubmit={begin}>
          <p role="status">{count ? `${count} ${count === 1 ? 'placement' : 'placements'} selected` : 'Select a square on the hoodie to begin.'}</p>
          <fieldset disabled={locked} className="putty-bids">
            <legend>Your price</legend>
            <div className="putty-bid-header" aria-hidden="true"><span>Placement</span><span>Price</span></div>
            {Object.entries(selected).map(([id, value]) => {
              const spot = spots.find(item => item.id === id)
              const label = id === 'front' ? 'Front left chest' : `Square ${id}`
              const minimum = spot.minimum ?? cents(value) ?? 0
              return <div key={id} className="putty-bid-row">
                <label htmlFor={`bid-${id}`}>{label}</label>
                <div className="putty-price"><span aria-hidden="true">$</span><input id={`bid-${id}`} type="number" inputMode="decimal" min={minimum / 100} step="0.01" required value={value}
                  aria-label={`${label} price, minimum ${formatPrice(minimum)}`} onChange={event => setSelected(old => ({ ...old, [id]: event.target.value }))}
                  onBlur={() => { if ((cents(value) ?? -1) < minimum) setSelected(old => ({ ...old, [id]: (minimum / 100).toFixed(2) })) }} /></div>
              </div>
            })}
          </fieldset>
          <label className="checkout-label" htmlFor="putty-email">Email</label>
          <input className="oro-input" id="putty-email" type="email" autoComplete="email" maxLength={254} required disabled={locked}
            value={email} onChange={event => setEmail(event.target.value)} aria-describedby="putty-credit-note" />
          <p className="putty-note" id="putty-credit-note">Use the same email to apply previous payments.</p>
          <label className="checkout-label" htmlFor="putty-name">Display name <span>(optional)</span></label>
          <input className="oro-input" id="putty-name" autoComplete="nickname" maxLength={60} disabled={locked} value={name}
            onChange={event => setName(event.target.value)} placeholder="Your name on the hoodie grid" aria-describedby="putty-name-note" />
          <p className="putty-note" id="putty-name-note">Leave blank to show “Anonymous”.</p>
          <p className="putty-note">All payments are final. No refunds or returns.</p>
          <label className="putty-consent">
            <input type="checkbox" required checked={consent} disabled={locked} onChange={event => setConsent(event.target.checked)} />
            <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.</span>
          </label>
          <button type="submit" className="oro-button oro-button--primary checkout-button" disabled={locked || !count || !board?.enabled}>{busy ? 'Opening Stripe checkout…' : 'Continue to payment ↗'}</button>
          <p className="putty-note">We’ll hold your squares for three minutes while you pay.</p>
        </form>}
    </section>
  </div>
}
