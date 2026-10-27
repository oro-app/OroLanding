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
  const [discountCode, setDiscountCode] = useState('')
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState('')
  const [discountStatus, setDiscountStatus] = useState('')
  if (state.type === 'loading') return <CheckoutFormSkeleton includePrice={false} />
  if (state.type === 'error') return <p role="alert">We couldn’t load secure payment. Please refresh to try again.</p>

  async function submit(event) {
    event.preventDefault()
    if (!consent || busy || applyingDiscount) return
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

  async function applyDiscount() {
    if (busy || applyingDiscount || !discountCode.trim()) return
    setApplyingDiscount(true)
    setDiscountError('')
    setDiscountStatus('')
    try {
      const result = await state.checkout.applyPromotionCode(discountCode.trim())
      if (result.type === 'error') setDiscountError(result.error.message || 'This code could not be applied. Check it and try again.')
      else setDiscountStatus(`Discount code applied. Due today: ${result.session.total.total.amount}.`)
    } catch {
      setDiscountError('We could not apply this code. Please try again.')
    } finally {
      setApplyingDiscount(false)
    }
  }

  return <form onSubmit={submit}>
    <label className="checkout-label" htmlFor="checkout-email">Email</label>
    <input className="oro-input" id="checkout-email" type="email" autoComplete="email"
      value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
    {collectPhone && <><label className="checkout-label" htmlFor="checkout-phone">Phone number for texting Oro</label>
      <input className="oro-input" id="checkout-phone" type="tel" autoComplete="tel" value={phone}
        onChange={event => setPhone(event.target.value)} placeholder="(416) 555-0123" required maxLength={32} disabled={busy} /></>}
    <div className="checkout-payment"><PaymentElement options={{ layout: 'tabs', ...(collectPhone ? { fields: { billingDetails: { phone: 'never', email: 'never' } } } : {}) }} /></div>
    <label className="checkout-label" htmlFor="checkout-discount">Discount code (optional)</label>
    <div className="checkout-discount-field">
      <input className="oro-input" id="checkout-discount" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false}
        value={discountCode} onChange={event => { setDiscountCode(event.target.value); setDiscountError('') }}
        onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); applyDiscount() } }}
        aria-invalid={Boolean(discountError)} aria-describedby="checkout-discount-status" disabled={busy || applyingDiscount} />
      <button className="oro-button" type="button" onClick={applyDiscount} disabled={busy || applyingDiscount || !discountCode.trim()}>
        {applyingDiscount ? 'Applying…' : 'Apply'}
      </button>
    </div>
    <div id="checkout-discount-status" role="status" aria-atomic="true">
      {discountError ? <p className="checkout-error">{discountError}</p> : discountStatus && <p>{discountStatus}</p>}
    </div>
    <p className="checkout-period">Due today: {total}<br /><span id="checkout-renewal">Renews at US $25/month until canceled.</span></p>
    <label className="checkout-consent">
      <input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} disabled={busy}
        aria-describedby={collectPhone ? 'checkout-renewal checkout-messaging-notice' : 'checkout-renewal'} />
      <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms</a>{collectPhone && <> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and consent to recurring automated styling texts from Oro</>}.</span>
    </label>
    {collectPhone && <p className="checkout-messaging-notice" id="checkout-messaging-notice">Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.</p>}
    {error && <p className="checkout-error" role="alert">{error}</p>}
    <button className="oro-button oro-button--primary checkout-button" disabled={!consent || busy || applyingDiscount} type="submit">
      {busy ? 'Confirming payment…' : 'Meet my personal stylist'}
    </button>
    <p className="checkout-fineprint">Secure payment by Stripe<br />
      <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a>
    </p>
  </form>
}
