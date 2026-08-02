import { BackButton, Dropdown } from '@oro/ui'
import { Chip, Cta } from '@oro/web'
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
const QUESTIONS = ['name', 'birthday', 'province', 'hear', 'phone']

const PROVINCES = [
  ['AB', 'Alberta'],
  ['BC', 'British Columbia'],
  ['MB', 'Manitoba'],
  ['NB', 'New Brunswick'],
  ['NL', 'Newfoundland and Labrador'],
  ['NS', 'Nova Scotia'],
  ['NT', 'Northwest Territories'],
  ['NU', 'Nunavut'],
  ['ON', 'Ontario'],
  ['PE', 'Prince Edward Island'],
  ['QC', 'Quebec'],
  ['SK', 'Saskatchewan'],
  ['YT', 'Yukon'],
]

const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
  ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
  ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
  ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
  ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
  ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
  ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
  ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
  ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]

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

const API_BASE = import.meta.env.VITE_ORO_API_URL || 'https://api.buildingoro.ca'

function ageFromISO(iso) {
  if (!iso) return null
  const match = iso.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (!match) return null
  const [, year, month, day] = match.map(Number)
  const dob = new Date(year, month - 1, day)
  if (dob.getFullYear() !== year || dob.getMonth() !== month - 1 || dob.getDate() !== day) return null
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
  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') {
      return { name: '', birthday: '', country: '', province: '', hear: [], hearOther: '', phone: '' }
    }

    try {
      const saved = JSON.parse(localStorage.getItem('oro_get_started_responses'))
      const country = saved?.country === 'CA' || saved?.country === 'US'
        ? saved.country
        : PROVINCES.some(([code]) => code === saved?.province) ? 'CA' : ''
      const locations = country === 'US' ? US_STATES : PROVINCES
      return {
        name: typeof saved?.name === 'string' ? saved.name.slice(0, 50) : '',
        birthday: typeof saved?.birthday === 'string' ? saved.birthday : '',
        country,
        province: locations.some(([code]) => code === saved?.province) ? saved.province : '',
        hear: Array.isArray(saved?.hear) ? saved.hear.filter((item) => typeof item === 'string') : [],
        hearOther: typeof saved?.hearOther === 'string' ? saved.hearOther.slice(0, 100) : '',
        phone: typeof saved?.phone === 'string' ? saved.phone : '',
      }
    } catch {
      return { name: '', birthday: '', country: '', province: '', hear: [], hearOther: '', phone: '' }
    }
  })
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

  useEffect(() => {
    try {
      localStorage.setItem('oro_get_started_responses', JSON.stringify(form))
    } catch {
      // Signup still works when storage is unavailable or full.
    }
  }, [form])

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const qIndex = QUESTIONS.indexOf(view)
  const onQuestion = qIndex !== -1

  // Whether the current question is answered well enough to continue.
  const canContinue = useMemo(() => {
    switch (view) {
      case 'name': return form.name.trim().length > 0
      case 'birthday': return ageFromISO(form.birthday) !== null
      case 'province': return (form.country === 'CA' ? PROVINCES : form.country === 'US' ? US_STATES : [])
        .some(([code]) => code === form.province)
      case 'hear': return form.hear.length > 0
      case 'phone': return form.phone.length > 0
      case 'otp': return code.length === 6
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
    setForm({ name: '', birthday: '', country: '', province: '', hear: [], hearOther: '', phone: '' })
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
        name: form.name,
        birthday: form.birthday.replaceAll('/', '-'),
        ...(form.country === 'CA'
          ? { province: form.province }
          : { state: form.province }),
        heard_about: [
          ...form.hear,
          form.hear.includes('somewhere else') ? form.hearOther.trim() : '',
        ].filter(Boolean).join(', '),
        phone: form.phone.trim(),
        consent: true,
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
    if (view === 'province' && form.country === 'CA' && form.province === 'QC') {
      goTo('region-ineligible')
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

  const displayName = form.name
  const locationOptions = form.country === 'US' ? US_STATES : PROVINCES

  const toggleHear = (option) => {
    setForm((current) => ({
      ...current,
      hear: current.hear.includes(option)
        ? current.hear.filter((item) => item !== option)
        : [...current.hear, option],
      hearOther: option === 'somewhere else' && current.hear.includes(option)
        ? ''
        : current.hearOther,
    }))
  }

  return (
    <main className="gs" data-view={view}>
      {/* Top bar: back + progress. Only shown on the question screens. */}
      {onQuestion && (
        <div className="gs-bar">
          <BackButton onPress={back} accessibilityLabel="go back" />
          <div className="gs-progress" aria-hidden="true">
            <span
              className="gs-progress-fill"
              style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }}
            />
          </div>
          <span className="gs-progress-count">
            <span className="gs-progress-current">{qIndex + 1}</span>
            <span className="gs-progress-of"> / <span className="gs-progress-total">{QUESTIONS.length}</span></span>
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
                maxLength={50}
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
              <DateField
                value={form.birthday}
                onChange={set('birthday')}
                onEnter={advance}
              />
            </Question>
          )}

          {view === 'hear' && (
            <Question
              label="how'd you hear about oro?"
              canContinue={canContinue}
              onContinue={advance}
            >
              <div className="gs-chips">
                {HEAR_OPTIONS.map((opt) => (
                  <Chip key={opt} pill selected={form.hear.includes(opt)} onClick={() => toggleHear(opt)}>
                    {opt}
                  </Chip>
                ))}
              </div>
              {form.hear.includes('somewhere else') && (
                <TextField
                  value={form.hearOther}
                  onChange={set('hearOther')}
                  onEnter={advance}
                  placeholder="tell us more (optional)"
                  maxLength={100}
                  aria-label="tell us where you heard about oro"
                />
              )}
            </Question>
          )}

          {view === 'province' && (
            <Question
              label="where are you located?"
              hint="choose your country, then your region."
              canContinue={canContinue}
              onContinue={advance}
            >
              <div className="gs-country-options">
                {[
                  ['CA', 'canada'],
                  ['US', 'united states'],
                ].map(([code, name]) => (
                  <Chip
                    key={code}
                    pill
                    selected={form.country === code}
                    onClick={() => {
                      setForm((current) => ({ ...current, country: code, province: '' }))
                    }}
                  >
                    {name}
                  </Chip>
                ))}
              </div>
              {form.country && <div className="gs-province-select">
                <Dropdown
                  label={form.country === 'CA' ? 'province or territory' : 'state'}
                  value={form.province}
                  options={locationOptions.map(([code, name]) => ({ value: code, label: name, hint: code }))}
                  onChange={(value) => set('province')(value)}
                  sheetTitle={form.country === 'CA' ? 'province or territory' : 'state'}
                />
              </div>}
            </Question>
          )}

          {view === 'phone' && (
            <Question
              label={displayName ? `last thing, ${displayName}.` : 'last thing.'}
              hint="your number"
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
                onChange={(value) => set('phone')(value.replace(/\D/g, '').slice(0, 11))}
                onEnter={advance}
                placeholder="15550000000"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={11}
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
                onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                onEnter={advance}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
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
                {displayName ? `${displayName}, oro` : 'oro'} just texted you 🤍
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
                no stress — run through the questions once
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
                come back in a bit — we'll be here, and we'll have a fit waiting.
              </p>
              <button type="button" className="gs-textlink" onClick={restart}>
                start over
              </button>
            </div>
          )}

          {view === 'region-ineligible' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">not there just yet.</p>
              <h1 className="gs-terminal-title">
                oro isn't available in <span className="gs-em">quebec</span> yet.
              </h1>
              <p className="gs-terminal-sub">
                we're working on it — check back soon.
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
      <p className="gs-eyebrow">your stylist, on demand.</p>
      <h1 className="gs-welcome-title">
        your stylist is <span className="gs-em">2 minutes</span> away.
      </h1>
      <p className="gs-welcome-sub">
        a few quick questions, then oro texts you and we get to work.
      </p>
      <Cta size="full" inverse className="gs-cta" onClick={onStart}>
        get started.
      </Cta>
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
      <Cta
        size="full"
        inverse
        className="gs-cta"
        data-loading={loading}
        disabled={!canContinue || loading}
        onClick={onContinue}
      >
        {cta}{loading ? '…' : '.'}
      </Cta>
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

function DateField({ value, onChange, onEnter }) {
  const yearRef = useRef(null)
  const monthRef = useRef(null)
  const dayRef = useRef(null)
  const [year = '', month = '', day = ''] = value.split('/')

  const updatePart = (part, next) => {
    const digits = next.replace(/\D/g, '')
    const parts = [year, month, day]
    parts[part] = digits.slice(0, part === 0 ? 4 : 2)
    onChange(parts.join('/'))

    if (part === 0 && digits.length >= 4) monthRef.current?.focus()
    if (part === 1 && digits.length >= 2) dayRef.current?.focus()
  }

  const handlePaste = (event) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (digits.length < 4) return
    event.preventDefault()
    onChange([digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].join('/'))
    if (digits.length >= 6) dayRef.current?.focus()
    else monthRef.current?.focus()
  }

  return (
    <div className="gs-date-field">
      <div className="gs-date-parts" onPaste={handlePaste}>
        <input
          ref={yearRef}
          value={year}
          onChange={(event) => updatePart(0, event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') onEnter?.() }}
          placeholder="yyyy"
          inputMode="numeric"
          autoComplete="bday-year"
          maxLength={4}
          aria-label="birth year"
        />
        <span>/</span>
        <input
          ref={monthRef}
          value={month}
          onChange={(event) => updatePart(1, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !month) yearRef.current?.focus()
            if (event.key === 'Enter') onEnter?.()
          }}
          placeholder="mm"
          inputMode="numeric"
          autoComplete="bday-month"
          maxLength={2}
          aria-label="birth month"
        />
        <span>/</span>
        <input
          ref={dayRef}
          value={day}
          onChange={(event) => updatePart(2, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !day) monthRef.current?.focus()
            if (event.key === 'Enter') onEnter?.()
          }}
          placeholder="dd"
          inputMode="numeric"
          autoComplete="bday-day"
          maxLength={2}
          aria-label="birth day"
        />
      </div>
      <input
        className="gs-date-picker"
        type="date"
        value={/^\d{4}\/\d{2}\/\d{2}$/.test(value) ? value.replaceAll('/', '-') : ''}
        onChange={(event) => onChange(event.target.value.replaceAll('-', '/'))}
        aria-label="open birthday date picker"
        tabIndex={-1}
      />
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      </svg>
    </div>
  )
}
