import { useRef, useState } from 'react'
import { Button, Heading, Text, TextField } from 'oro-kit'
import { HomeHeader } from '../home/HomeChrome'
import PhoneAnswer from './PhoneAnswer'
import { REFERRAL_CODE } from '../../lib/betaContract'
import './Beta.css'
import './TesterReferrals.css'

export default function TesterReferrals() {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [receipt, setReceipt] = useState(null)
  const pending = useRef(false)

  async function post(url, body) {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(25000) })
    const result = await response.json()
    if (!response.ok || result.ok !== true) throw new Error(result.code === 'rate_limited' ? 'Please wait a minute before trying again.' : result.code === 'invalid_code' ? 'That code is incorrect or expired. Try again or send a new code.' : 'We couldn’t check your progress. Please try again.')
    return result
  }

  async function verify(action) {
    if (pending.current) return
    pending.current = true
    setBusy(true); setMessage('')
    try {
      const result = await post('/api/beta-verify', { action, phone, ...(action === 'check' ? { code } : {}) })
      if (action === 'start') { setSent(true); setCode(''); return }
      const saved = await post('/api/beta-existing', { phone, phone_verification: result.proof })
      if (!saved.found || saved.tester !== true) { setMessage('We couldn’t find an approved tester for this number. Use the number you signed up with, or contact sunny@buildingoro.ca.'); return }
      if (!REFERRAL_CODE.test(saved.referral_code || '') || !Number.isSafeInteger(saved.referred_signups) || saved.referred_signups < 0) throw new Error('We couldn’t check your progress. Please try again.')
      setReceipt(saved)
    } catch (error) { setMessage(error.name === 'TimeoutError' || error.name === 'TypeError' ? 'We couldn’t connect. Please try again.' : error.message) }
    finally { pending.current = false; setBusy(false) }
  }

  const count = receipt?.referred_signups || 0
  const unlocked = count >= 8
  const link = receipt ? `${window.location.origin}/invite?ref=${receipt.referral_code}` : ''
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setMessage('Invite link copied.') }
    catch { setMessage('Copy the invite link from the field above.') }
  }

  return <div className="beta-page tester-referrals ph-no-capture" data-private="true">
    <HomeHeader />
    <section className="beta-application" aria-labelledby="tester-title">
      <div className="beta-story-halo" aria-hidden="true" />
      <div className="beta-form-panel">
        <Heading as="h1" variant="title" id="tester-title">{receipt ? unlocked ? 'you unlocked the goods.' : 'you got her number.' : 'your referrals.'}</Heading>
        {receipt ? <>
          <Text>Share your invite. Bring 8 new friends to oro and earn a free hoodie + tote.</Text>
          <p className="tester-count" role="status">{count} / 8 friends joined</p>
          <progress max="8" value={Math.min(count, 8)} aria-label={`${count} of 8 friends joined`} />
          <Text>{unlocked ? 'Your hoodie + tote is unlocked! Email sunny@buildingoro.ca to arrange your reward.' : `${8 - count} more ${8 - count === 1 ? 'friend' : 'friends'} to unlock your hoodie + tote.`}</Text>
          <TextField id="tester-link" label="Your invite link" value={link} readOnly />
          <Button onClick={copyLink}>copy my invite link</Button>
          <Text variant="support" muted>New signups through your link count once per verified phone number. Your own signup and repeat signups don’t count.</Text>
          <button className="beta-resend" onClick={() => { setReceipt(null); setSent(false); setCode(''); setMessage('') }}>check updated progress</button>
        </> : <form className="beta-form" onSubmit={(event) => { event.preventDefault(); verify(sent ? 'check' : 'start') }} aria-busy={busy}>
          <Text>Verify the phone number you used for the beta to see your invite link and hoodie + tote progress.</Text>
          <PhoneAnswer value={phone} disabled={busy} update={(_, value) => { setPhone(value); setSent(false); setCode(''); setMessage('') }} />
          {sent && <TextField id="tester-code" label="Verification code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="one-time-code" disabled={busy} required />}
          <Button type="submit" disabled={busy || !phone || (sent && !code)}>{busy ? 'one moment…' : sent ? 'see my progress' : 'send my code'}</Button>
          {sent && <button type="button" className="beta-resend" disabled={busy} onClick={() => verify('start')}>send a new code</button>}
        </form>}
        {message && <p role="status">{message}</p>}
        <Text variant="support" muted>Need help? <a href="mailto:sunny@buildingoro.ca">Email us</a></Text>
      </div>
    </section>
  </div>
}
