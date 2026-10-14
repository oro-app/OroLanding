import { useState } from 'react'
import { PaymentElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout'
import { formatPrice } from '../../lib/checkout'
import { puttyRequest } from '../../lib/putty'

export default function PuttyPayment({ order, onStatus }) {
  const state = useCheckoutElements()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (state.type === 'loading') return <p role="status">Loading secure payment…</p>
  if (state.type === 'error') return <p role="alert">Secure payment couldn’t load. Cancel this hold and try again.</p>

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const current = await puttyRequest('status', { order_id: order.order_id })
      if (current.status !== 'pending' || Date.parse(current.hold_until) <= Date.now()) {
        onStatus(current)
        return
      }
      const result = await state.checkout.confirm({ redirect: 'if_required' })
      if (result.type === 'error') setError(result.error.message || 'Payment didn’t go through. Please try again.')
      else onStatus(await puttyRequest('status', { order_id: order.order_id }))
    } catch (failure) {
      setError(`${failure.message} Use “Check payment status” before starting another payment.`)
    } finally { setBusy(false) }
  }

  return <form onSubmit={submit}>
    <div className="checkout-payment"><PaymentElement options={{ layout: 'tabs' }} /></div>
    <p className="putty-note">One-time payment. Your claim is confirmed only after payment clears.</p>
    <p role="alert" className="checkout-error">{error}</p>
    <button type="submit" className="oro-button oro-button--primary checkout-button" disabled={busy}>
      {busy ? 'Confirming payment…' : `Pay ${formatPrice(order.amount)} USD`}
    </button>
    <p className="checkout-fineprint">Secure payment by Stripe · <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy policy</a></p>
  </form>
}
