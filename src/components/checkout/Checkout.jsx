import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import { checkoutRequest, countdown, formatPrice, readCheckoutToken, stripeAppearance, startPublicCheckout, isPublicCheckoutToken, saveCheckoutInvite, clearCheckoutToken } from '../../lib/checkout'
import { getOroTextLink } from '../../lib/textOro'
import CheckoutForm, { CheckoutFormSkeleton } from './CheckoutForm'
import './Checkout.css'

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const PAID_STATES = ['ready', 'already_subscribed', 'already_has_access']

export default function Checkout() {
  const [entry] = useState(() => {
    saveCheckoutInvite()
    const personalLink = typeof window !== 'undefined' && new URLSearchParams(window.location.hash.slice(1)).has('token')
    return { personalLink, token: readCheckoutToken() }
  })
  const token = useRef(entry.token)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(Date.now)
  const [checking, setChecking] = useState(false)
  const [polls, setPolls] = useState(0)
  const stripe = useMemo(() => {
    const key = data?.publishable_key || publishableKey
    return key ? loadStripe(key) : null
  }, [data?.publishable_key])
  const refresh = useCallback(async (signal) => {
    setLoading(true)
    setError('')
    try {
      let result
      if (token.current) {
        try {
          result = await checkoutRequest(token.current, 'status', signal)
          if (result.status === 'checkout_ready') result = await checkoutRequest(token.current, 'checkout', signal)
        } catch (failure) {
          if (signal?.aborted || ![401, 403, 410].includes(failure.status)
            || (entry.personalLink && !isPublicCheckoutToken(token.current))) throw failure
          clearCheckoutToken()
          token.current = ''
        }
      }
      if (!token.current) {
        result = await startPublicCheckout()
        token.current = result.token
      }
      if (!signal?.aborted) {
        setData(result)
        setChecking(result.status === 'payment_pending')
      }
    } catch (failure) {
      if (!signal?.aborted) { setError(failure.message); setChecking(false) }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [entry.personalLink])

  useEffect(() => {
    const controller = new AbortController()
    refresh(controller.signal)
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [refresh])

  useEffect(() => {
    if (!checking || polls >= 15) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      await refresh(controller.signal)
      if (!controller.signal.aborted) setPolls(value => value + 1)
    }, 3000)
    return () => { controller.abort(); clearTimeout(timer) }
  }, [checking, polls, refresh])

  async function acceptNotice(phone) {
    if (!isPublicCheckoutToken(token.current)) return true
    const result = await checkoutRequest(token.current, 'accept', undefined, { phone, terms_accepted: true, texting_consent: true })
    if (result.status === 'checkout_ready') return true
    setData(result)
    setChecking(result.status === 'payment_pending')
    return false
  }

  const offer = data?.offer
  const expired = offer?.launch_offer_ends_at && now >= Date.parse(offer.launch_offer_ends_at)
  useEffect(() => {
    if (!expired || loading || checking || data?.status !== 'checkout') return
    const controller = new AbortController()
    refresh(controller.signal)
    return () => controller.abort()
  }, [expired, data?.session_id, refresh])

  const options = useMemo(() => ({
    clientSecret: data?.client_secret,
    elementsOptions: {
      appearance: stripeAppearance(),
      fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap' }],
    },
  }), [data?.client_secret])
  const paid = data && PAID_STATES.includes(data.status)
  const discounted = offer?.first_month_discount_percent === 50 && !expired
  const remaining = discounted ? countdown(offer.launch_offer_ends_at, now) : null
  let inviteUrl = ''
  try {
    const url = new URL(sessionStorage.getItem('oro_checkout_invite') || '')
    if (url.origin === window.location.origin && url.pathname === '/invite' && /^[0-9a-f]{64}$/.test(url.searchParams.get('ref') || '')) inviteUrl = url.href
  } catch {}
  const textLink = getOroTextLink(undefined, inviteUrl)

  return <div className="checkout-page halo-container">
    <div className="checkout-layout">
      <section className="checkout-story">
        {loading && !data ? <div className="checkout-story-skeleton" aria-hidden="true"><span /><span /></div>
          : <h1>{discounted ? <>A little<br />launch <em>gift.</em></> : <>Your next<br />good <em>outfit.</em></>}</h1>}
        {remaining && !loading && <div className="checkout-countdown">
          <p>Offer ends in</p>
          <div className="checkout-clock" role="timer" aria-label="Time until midnight Eastern Time on October 14">
            {remaining.map((value, index) => <div key={index}><span>{value}</span><small>{['hours', 'minutes', 'seconds'][index]}</small></div>)}
          </div>
        </div>}
      </section>
      <section className="checkout-card" aria-label="Oro subscription checkout" aria-busy={loading}>
        {error ? <><p role="alert">{error}</p><button className="oro-button" onClick={() => refresh()}>Try again</button><p><a href={textLink}>Text Oro</a></p></> : paid ? <>
          <h2>You’re <em>in.</em></h2><p>Your stylist is ready. Head back to your conversation.</p><a className="oro-button" href={textLink}>Back to Oro ↗</a>
        </> : checking || data?.status === 'payment_pending' ? <>
          <h2>Getting you ready.</h2><p role="status">We’re confirming your payment and setting up your stylist.</p><button className="oro-button" onClick={() => { setPolls(0); refresh() }}>Check status</button>
        </> : loading && !data ? <CheckoutFormSkeleton /> : data?.status === 'checkout' ? <>
          <div className="checkout-price"><span>{formatPrice(offer.first_month_amount)}</span>{discounted && <del aria-label="Regular price $25">{formatPrice(offer.amount)}</del>}</div>
          {discounted ? <div className="checkout-discount">50% off your first month</div> : <p className="checkout-period">per month</p>}
          {data.client_secret && stripe ? <CheckoutElementsProvider key={data.session_id} stripe={stripe} options={options}>
            <CheckoutForm offer={offer} collectPhone={data.collect_phone === true} onAccept={acceptNotice} onPaid={() => { setChecking(true); setPolls(0); refresh() }} onExpired={() => refresh()} />
          </CheckoutElementsProvider> : <><p>Continue to secure checkout to complete your subscription.</p>
            {data.checkout_url && !data.client_secret ? <a className="oro-button" href={data.checkout_url}>Meet my personal stylist</a> : <p role="alert">Secure payment is unavailable. Please text Oro for help.</p>}
          </>}
        </> : <><h2>Let’s get you set up.</h2><p>Text Oro to continue your signup or get help with your subscription.</p><a className="oro-button" href={textLink}>Text Oro ↗</a></>}
      </section>
    </div>
  </div>
}
