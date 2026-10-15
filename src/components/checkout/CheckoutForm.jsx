import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { useState } from 'react'
import { PaymentElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout'

export function CheckoutFormSkeleton({ includePrice = true }) {
  return <>
    <p className="sr-only">Loading checkout…</p>
    <div className="checkout-skeleton" aria-hidden="true">
      {includePrice && <span className="checkout-skeleton-price" />}
      <span className="checkout-skeleton-line checkout-skeleton-line--short" />
      <span className="checkout-skeleton-field" />
      <span className="checkout-skeleton-field checkout-skeleton-field--payment" />
      <span className="checkout-skeleton-line" />
      <span className="checkout-skeleton-button" />
    </div>
  </>
}

export default function CheckoutForm({ offer, onPaid, onExpired, collectPhone = false, onAccept }) {
  const state = useCheckoutElements()
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (state.type === 'loading') return <CheckoutFormSkeleton includePrice={false} />
  if (state.type === 'error') return <p role="alert">We couldn’t load secure payment. Please refresh to try again.</p>

  async function submit(event) {
    event.preventDefault()
    if (!consent || busy) return
    if (offer.launch_offer_ends_at && Date.now() >= Date.parse(offer.launch_offer_ends_at)) return onExpired()
    let phoneNumber
    if (collectPhone) {
      const parsed = parsePhoneNumberFromString(phone, { defaultCountry: 'CA', extract: false })
      if (!parsed?.isValid() || parsed.ext) { setError('Enter a valid phone number for texting Oro.'); return }
      phoneNumber = parsed.number
    }
    setBusy(true)
    setError('')
    try {
      if (onAccept && !(await onAccept(phoneNumber))) return
      const result = await state.checkout.confirm({ email, ...(phoneNumber ? { phoneNumber } : {}), redirect: 'if_required' })
      if (result.type === 'error') setError(result.error.message || 'Payment didn’t go through. Please try again.')
      else onPaid()
    } catch {
      setError('We couldn’t confirm the payment. Check its status before trying again.')
    } finally {
      setBusy(false)
    }
  }

  const total = state.checkout.total.total.amount

  return <form onSubmit={submit}>
    <label className="checkout-label" htmlFor="checkout-email">Email</label>
    <input className="oro-input" id="checkout-email" type="email" autoComplete="email"
      value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
    {collectPhone && <><label className="checkout-label" htmlFor="checkout-phone">Phone number for texting Oro</label>
      <input className="oro-input" id="checkout-phone" type="tel" autoComplete="tel" value={phone}
        onChange={event => setPhone(event.target.value)} placeholder="(416) 555-0123" required maxLength={32} disabled={busy} /></>}
    <div className="checkout-payment"><PaymentElement options={{ layout: 'tabs', ...(collectPhone ? { fields: { billingDetails: { phone: 'never', email: 'never' } } } : {}) }} /></div>
    <p className="checkout-period">Due today: {total}</p>
    <label className="checkout-consent">
      <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy} />
      <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>{collectPhone && <>, acknowledge the <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and consent to recurring automated SMS/MMS from Oro at this number. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help</>}. Renews at $25/month until canceled.</span>
    </label>
    {error && <p className="checkout-error" role="alert">{error}</p>}
    <button className="oro-button oro-button--primary checkout-button" disabled={!consent || busy} type="submit">
      {busy ? 'Confirming payment…' : 'Meet my personal stylist'}
    </button>
    <p className="checkout-fineprint">Secure payment by Stripe<br />
      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
    </p>
  </form>
}
