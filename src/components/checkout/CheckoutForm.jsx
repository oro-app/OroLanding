import { useState } from 'react'
import { PaymentElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout'

export default function CheckoutForm({ offer, onPaid, onExpired }) {
  const state = useCheckoutElements()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (state.type === 'loading') return <p role="status">Loading secure payment…</p>
  if (state.type === 'error') return <p role="alert">We couldn’t load secure payment. Please refresh to try again.</p>

  async function submit(event) {
    event.preventDefault()
    if (!consent || busy) return
    if (offer.launch_offer_ends_at && Date.now() >= Date.parse(offer.launch_offer_ends_at)) return onExpired()
    setBusy(true)
    setError('')
    try {
      const result = await state.checkout.confirm({ email, redirect: 'if_required' })
      if (result.type === 'error') setError(result.error.message || 'Payment didn’t go through. Please try again.')
      else onPaid()
    } catch {
      setError('We couldn’t confirm the payment. Check its status before trying again.')
    } finally {
      setBusy(false)
    }
  }

  return <form onSubmit={submit}>
    <label className="checkout-label" htmlFor="checkout-email">Email</label>
    <input className="oro-input" id="checkout-email" type="email" autoComplete="email"
      value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
    <div className="checkout-payment"><PaymentElement options={{ layout: 'tabs' }} /></div>
    <label className="checkout-consent">
      <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy} />
      <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>. Renews at $25/month until canceled.</span>
    </label>
    {error && <p className="checkout-error" role="alert">{error}</p>}
    <button className="oro-button oro-button--primary checkout-button" disabled={!consent || busy} type="submit">
      {busy ? 'Confirming payment…' : 'Meet my personal stylist'}<span aria-hidden="true">↗</span>
    </button>
    <p className="checkout-fineprint">Prices in USD · Secure payment by Stripe<br />
      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
    </p>
  </form>
}
