import { useEffect, useMemo, useRef, useState } from 'react'
import { trackEvent } from '../../lib/analytics'
import './GetStarted.css'

// Signup flow for the text-first pivot, wired to oro-central's public
// onboarding endpoints (BUI-415): POST /onboarding/start sends the OTP,
// POST /onboarding/verify creates the account and triggers the opening text.
// One question per screen; province + age gates are surfaced client-side only
// (server-side enforcement is BUI-421).

// Ordered question screens. Drives the progress bar + next/back navigation.
// Quebec exclusion is a passive attestation in the consent note (product call,
// July 2026 — wording to be blessed by counsel under BUI-421), not a screen.
const QUESTIONS = ['name', 'birthday', 'hear', 'phone']

const HEAR_OPTIONS = [
  'instagram',
  'tiktok',
  'facebook',
  'a friend',
  'google',
  'app store',
  'play store',
  'somewhere else',
]

// Minimum age — oro is 16+ (hard gate on the Figma flow).
const MIN_AGE = 16

// Matches the server's resend cooldown on /onboarding/start.
const RESEND_COOLDOWN_SECONDS = 60

const API_BASE = import.meta.env.VITE_ORO_API_URL || ''

function ageFromISO(iso) {
  if (!iso) return null
  const dob = new Date(iso)
  if (Number.isNaN(dob.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1
  return age
}

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let detail = ''
  try {
    const data = await res.json()
    if (typeof data?.detail === 'string') detail = data.detail
  } catch {
    // non-JSON body (proxy error page etc.) — status code is enough
  }
  return { status: res.status, detail }
}

export default function GetStarted() {
  // 'welcome' → question screens → 'otp' → 'done'.
  // Dead ends: 'ineligible' (age/province) and 'already' (phone already signed up).
  const [view, setView] = useState('welcome')
  const [form, setForm] = useState({ name: '', birthday: '', hear: '', phone: '' })
  const [code, setCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // Seconds left before /start may be re-called for a fresh code.
  const [resendLeft, setResendLeft] = useState(0)

  // Direction the last transition moved, so the content can slide the right way.
  const [dir, setDir] = useState('fwd')

  useEffect(() => {
    if (resendLeft <= 0) return undefined
    const t = setTimeout(() => setResendLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendLeft])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const qIndex = QUESTIONS.indexOf(view)
  const onQuestion = qIndex !== -1

  // Whether the current question is answered well enough to continue.
  const canContinue = useMemo(() => {
    switch (view) {
      case 'name': return form.name.trim().length > 0
      case 'birthday': return ageFromISO(form.birthday) !== null
      case 'hear': return form.hear.length > 0
      case 'phone': return form.phone.replace(/\D/g, '').length >= 7
      case 'otp': return code.trim().replace(/\D/g, '').length >= 4
      default: return true
    }
  }, [view, form, code])

  const goTo = (next, direction = 'fwd') => {
    setDir(direction)
    setError('')
    setNotice('')
    setView(next)
  }

  const restart = () => {
    setForm({ name: '', birthday: '', hear: '', phone: '' })
    setCode('')
    setResendLeft(0)
    goTo('welcome', 'back')
  }

  // POST /onboarding/start. Returns the OTP screen on success (or when a code
  // is already in flight); surfaces contract errors inline.
  const startSignup = async ({ resend = false } = {}) => {
    if (loading) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const { status, detail } = await postJSON('/onboarding/start', {
        name: form.name.trim(),
        birthday: form.birthday,
        heard_about: form.hear,
        phone: form.phone.trim(),
      })
      if (status === 200) {
        trackEvent('onboarding_start', { resend })
        setResendLeft(RESEND_COOLDOWN_SECONDS)
        if (resend) setNotice('new code sent.')
        else goTo('otp')
      } else if (status === 409) {
        goTo('already')
      } else if (status === 429 && /already sent/i.test(detail)) {
        // A code from a recent attempt is still in flight — let them enter it.
        setResendLeft(RESEND_COOLDOWN_SECONDS)
        if (resend) setNotice('a code was already sent — give it a minute.')
        else { goTo('otp'); setNotice('we already texted you a code — use that one.') }
      } else if (status === 400) {
        setError(detail.toLowerCase() || 'that doesn’t look quite right — check it and try again.')
      } else if (status === 429) {
        setError('too many tries — wait a moment and try again.')
      } else {
        setError('couldn’t send the code — try again in a bit.')
      }
    } catch {
      setError('couldn’t reach oro — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // POST /onboarding/verify. Success = account created + oro's opening text sent.
  const verifyCode = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const { status, detail } = await postJSON('/onboarding/verify', {
        phone: form.phone.trim(),
        code: code.trim(),
      })
      if (status === 200) {
        trackEvent('onboarding_verified')
        goTo('done')
      } else if (status === 410) {
        goTo('expired')
      } else if (status === 400) {
        setError(/phone/i.test(detail) ? 'invalid phone number.' : 'that code didn’t match — double-check and try again.')
      } else {
        setError('couldn’t check the code — try again in a bit.')
      }
    } catch {
      setError('couldn’t reach oro — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const advance = () => {
    if (!canContinue || loading) return
    // Birthday gate: under-16 diverts to the ineligible dead-end.
    if (view === 'birthday' && ageFromISO(form.birthday) < MIN_AGE) {
      goTo('ineligible')
      return
    }
    if (view === 'welcome') { goTo(QUESTIONS[0]); return }
    if (view === 'phone') { startSignup(); return }
    if (view === 'otp') { verifyCode(); return }
    const nextIndex = qIndex + 1
    goTo(nextIndex < QUESTIONS.length ? QUESTIONS[nextIndex] : 'done')
  }

  const back = () => {
    if (qIndex === 0) { goTo('welcome', 'back'); return }
    goTo(QUESTIONS[qIndex - 1], 'back')
  }

  const firstName = form.name.trim().split(/\s+/)[0]

  return (
    <main className="gs" data-view={view}>
      {/* Top bar: back + progress. Only shown on the question screens. */}
      {onQuestion && (
        <div className="gs-bar">
          <button type="button" className="gs-back" onClick={back} aria-label="go back">
            ←
          </button>
          <div className="gs-progress" aria-hidden="true">
            <span
              className="gs-progress-fill"
              style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
          <span className="gs-progress-count">
            {qIndex + 1}<span className="gs-progress-of"> / {QUESTIONS.length}</span>
          </span>
        </div>
      )}

      <div className="gs-stage">
        <div className="gs-screen" key={view} data-dir={dir}>
          {view === 'welcome' && (
            <Welcome onStart={advance} />
          )}

          {view === 'name' && (
            <Question
              label="first — what should I call you?"
              hint="just your first name is perfect."
              canContinue={canContinue}
              onContinue={advance}
            >
              <TextField
                value={form.name}
                onChange={set('name')}
                onEnter={advance}
                placeholder="your name"
                autoComplete="given-name"
                autoFocus
              />
            </Question>
          )}

          {view === 'birthday' && (
            <Question
              label="when's your birthday?"
              hint="oro is 16+."
              canContinue={canContinue}
              onContinue={advance}
            >
              <TextField
                type="date"
                value={form.birthday}
                onChange={set('birthday')}
                onEnter={advance}
                autoComplete="bday"
              />
            </Question>
          )}

          {view === 'hear' && (
            <Question
              label="how'd you hear about oro?"
              hint="no wrong answer."
              canContinue={canContinue}
              onContinue={advance}
            >
              <div className="gs-chips">
                {HEAR_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    className="gs-chip"
                    data-selected={form.hear === opt}
                    onClick={() => set('hear')(opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Question>
          )}

          {view === 'phone' && (
            <Question
              label={firstName ? `last thing, ${firstName}.` : 'last thing.'}
              hint="your number — this is where oro texts you."
              canContinue={canContinue}
              onContinue={advance}
              cta={loading ? 'sending' : 'text me'}
              loading={loading}
              error={error}
              footer={<ConsentNote />}
            >
              <TextField
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                onEnter={advance}
                placeholder="(555) 000-0000"
                autoComplete="tel"
                autoFocus
              />
            </Question>
          )}

          {view === 'otp' && (
            <Question
              label="we just texted you."
              hint={`enter the code we sent to ${form.phone.trim()}.`}
              canContinue={canContinue}
              onContinue={advance}
              cta={loading ? 'checking' : 'verify'}
              loading={loading}
              error={error}
              notice={notice}
              footer={
                <p className="gs-consent-line">
                  didn&rsquo;t get it?{' '}
                  <button
                    type="button"
                    className="gs-resend"
                    disabled={resendLeft > 0 || loading}
                    onClick={() => startSignup({ resend: true })}
                  >
                    {resendLeft > 0 ? `resend in ${resendLeft}s` : 'resend code'}
                  </button>
                </p>
              }
            >
              <TextField
                value={code}
                onChange={setCode}
                onEnter={advance}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                className="gs-input gs-input-otp"
                autoFocus
              />
            </Question>
          )}

          {view === 'done' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">you're in.</p>
              <h1 className="gs-terminal-title">
                check your <span className="gs-em">phone</span>.
              </h1>
              <p className="gs-terminal-sub">
                {firstName ? `${firstName}, oro` : 'oro'} just texted you 🤍 open it up and we'll
                get your closet started — first fit's minutes away.
              </p>
            </div>
          )}

          {view === 'already' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">welcome back.</p>
              <h1 className="gs-terminal-title">
                you're <span className="gs-em">already</span> signed up.
              </h1>
              <p className="gs-terminal-sub">
                this number is already with oro — just send a text and your stylist picks
                right back up.
              </p>
              <button type="button" className="gs-textlink" onClick={restart}>
                use a different number
              </button>
            </div>
          )}

          {view === 'expired' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">took a breather?</p>
              <h1 className="gs-terminal-title">
                that code <span className="gs-em">expired</span>.
              </h1>
              <p className="gs-terminal-sub">
                no stress — it just means a little time passed. run through the questions once
                more and we'll text you a fresh one.
              </p>
              <button type="button" className="gs-textlink" onClick={restart}>
                start over
              </button>
            </div>
          )}

          {view === 'ineligible' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">so close.</p>
              <h1 className="gs-terminal-title">
                oro is <span className="gs-em">16+</span> for now.
              </h1>
              <p className="gs-terminal-sub">
                come back when you're a little older — we'll be here, and we'll have a fit waiting.
              </p>
              <button type="button" className="gs-textlink" onClick={restart}>
                start over
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function Welcome({ onStart }) {
  return (
    <div className="gs-welcome">
      <p className="gs-eyebrow">your stylist, in your texts.</p>
      <h1 className="gs-welcome-title">
        your stylist is <span className="gs-em">2 minutes</span> away.
      </h1>
      <p className="gs-welcome-sub">
        a few quick questions, then oro texts you and we get to work. no app to open, no card to
        start.
      </p>
      <button type="button" className="gs-cta" onClick={onStart}>
        get started.
      </button>
    </div>
  )
}

function Question({
  label, hint, children, canContinue, onContinue, cta = 'continue', footer,
  loading = false, error = '', notice = '',
}) {
  return (
    <div className="gs-question">
      <h1 className="gs-q-label">{label}</h1>
      {hint && <p className="gs-q-hint">{hint}</p>}
      <div className="gs-q-field">{children}</div>
      {notice ? <p className="gs-notice" role="status">{notice}</p> : null}
      {error ? <p className="gs-error" role="alert">{error}</p> : null}
      {footer && <div className="gs-consent">{footer}</div>}
      <button
        type="button"
        className="gs-cta"
        data-loading={loading}
        onClick={onContinue}
        disabled={!canContinue || loading}
      >
        {cta}{loading ? '…' : '.'}
      </button>
    </div>
  )
}

// Consent + SMS opt-in shown at the phone step. Two distinct lines, worded to
// match the Terms ("by creating an account … you agree") and Privacy Policy
// (Twilio texts, msg & data rates, reply STOP). Entering a number creates the
// account (phone = account identifier via OTP), so this is the point of consent.
function ConsentNote() {
  return (
    <>
      <p className="gs-consent-line">
        by entering your number, you agree to oro's{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer">terms of service</a> and{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>, and
        confirm that you are not a resident of quebec.
      </p>
      <p className="gs-consent-line">
        you're also opting in to recurring automated texts from oro at this number — it's how oro
        styles you. msg &amp; data rates may apply, frequency varies. reply STOP to opt out, HELP for
        help.
      </p>
    </>
  )
}

function TextField({ value, onChange, onEnter, autoFocus, className = 'gs-input', ...rest }) {
  const ref = useRef(null)
  return (
    <input
      ref={ref}
      className={className}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
      }}
      {...rest}
    />
  )
}
