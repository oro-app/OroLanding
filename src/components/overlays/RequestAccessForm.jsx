import { useId, useState } from 'react'
import { trackEvent } from '../../lib/analytics'

const ERRORS = {
  invalid_phone: 'enter a US or Canadian number.',
  rate_limited: 'too many tries. give it a minute.',
}

function referralFrom(inviteUrl) {
  try {
    const ref = new URL(inviteUrl).searchParams.get('ref')
    return ref && /^[0-9a-f]{64}$/.test(ref) ? ref : undefined
  } catch {
    return undefined
  }
}

export default function RequestAccessForm({ source, inviteUrl = '' }) {
  const id = useId()
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  if (status === 'done') {
    return (
      <p className="request-access-done" role="status">
        you're on the list 💜 we'll text you soon.
      </p>
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!consent || !phone.trim() || status === 'sending') return
    setStatus('sending')
    setError('')
    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim(),
          terms_accepted: true,
          texting_consent: true,
          referral_code: referralFrom(inviteUrl),
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.code || 'unavailable')
      trackEvent('waitlist_request', { location: source, method: 'web_form' })
      setStatus('done')
    } catch (failure) {
      setError(ERRORS[failure.message] || "we couldn't save that. try again or text oro below.")
      setStatus('idle')
    }
  }

  return (
    <form className="request-access" onSubmit={submit} noValidate>
      <label className="request-access-label" htmlFor={`${id}-phone`}>leave your number and we'll reach out</label>
      <div className="request-access-row">
        <input id={`${id}-phone`} type="tel" autoComplete="tel" inputMode="tel"
          placeholder="(416) 555-0123" value={phone} onChange={(event) => setPhone(event.target.value)}
          disabled={status === 'sending'} aria-describedby={error ? `${id}-error` : undefined} />
        <button type="submit"
          disabled={!consent || !phone.trim() || status === 'sending'}>
          {status === 'sending' ? 'sending…' : 'request access'}
        </button>
      </div>
      <label className="request-access-consent">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)}
          disabled={status === 'sending'} />
        <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a> and to get texts from oro. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
      </label>
      {error && <p className="request-access-error" id={`${id}-error`} role="alert">{error}</p>}
    </form>
  )
}
