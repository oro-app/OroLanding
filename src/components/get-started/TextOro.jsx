import { useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { startPhoneCheckout, readCheckoutToken } from '../../lib/checkout'
import { getOroTextLink } from '../../lib/textOro'
import hello from '../../assets/mascot/oro_hi.webp'
import './TextOro.css'

export default function TextOro() {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [continueInText, setContinueInText] = useState(false)
  const invite = typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('invite') || ''
  let inviteUrl = ''
  try {
    const url = new URL(invite)
    if (url.origin === window.location.origin && url.pathname === '/invite' && /^[0-9a-f]{64}$/.test(url.searchParams.get('ref') || '')) inviteUrl = url.href
  } catch {}

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const parsed = parsePhoneNumberFromString(phone, { defaultCountry: 'CA', extract: false })
    if (!parsed?.isValid() || parsed.ext) { setError('Enter a valid phone number. Include the country code outside the US or Canada.'); return }
    try {
      const savedToken = readCheckoutToken()
      if (savedToken && sessionStorage.getItem('oro_checkout_phone') === parsed.number) {
        window.location.assign(`/checkout#token=${savedToken}`)
        return
      }
    } catch {}
    setBusy(true)
    setError('')
    try {
      const data = await startPhoneCheckout(parsed.number, AbortSignal.timeout(25000))
      if (data.status === 'continue_in_text') { setContinueInText(true); return }
      try { sessionStorage.setItem('oro_checkout_invite', inviteUrl) } catch {}
      window.location.assign(`/checkout#token=${data.token}`)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="text-oro" aria-labelledby="text-oro-title">
    <div className="text-oro-inner">
      <div className="text-oro-copy">
        <span className="text-oro-eyebrow">meet your personal stylist</span>
        <Heading as="h1" variant="title" id="text-oro-title">your next fit<br />starts here.</Heading>
        <Text className="text-oro-description">enter the number you’ll use to text oro, then choose your subscription. she’ll take it from there.</Text>
        {continueInText ? <div role="status"><Text>Text Oro to continue your signup or return to your existing subscription.</Text><a className="oro-button oro-button--primary text-oro-cta" href={getOroTextLink(undefined, inviteUrl)}>text oro ↗</a></div> : <form className="text-oro-form" onSubmit={submit}>
          <label htmlFor="signup-phone">Phone number</label>
          <input className="oro-input" id="signup-phone" type="tel" autoComplete="tel" placeholder="(416) 555-0123"
            value={phone} onChange={event => setPhone(event.target.value)} required maxLength={32} disabled={busy}
            aria-describedby={`signup-notice${error ? ' signup-error' : ''}`} aria-invalid={Boolean(error)} />
          <Text variant="support" muted className="text-oro-fine-print" id="signup-notice">By continuing, you agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and acknowledge the <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, confirm you’re 16+ and in the US or Canada (excluding Quebec), and consent to recurring automated SMS/MMS from Oro at this number. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.</Text>
          {error && <p id="signup-error" role="alert">{error}</p>}
          <button className="oro-button oro-button--primary text-oro-cta" type="submit" disabled={busy}>{busy ? 'getting ready…' : 'meet my stylist'} <span aria-hidden="true">↗</span></button>
        </form>}
      </div>
      <div className="text-oro-handoff"><img className="text-oro-mascot" src={hello} alt="oro waving hello" width="260" height="260" /></div>
    </div>
  </section>
}
