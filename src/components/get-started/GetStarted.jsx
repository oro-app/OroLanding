import { BackButton } from '@oro/ui'
import { Chip, Cta } from '@oro/web'
import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '../../lib/analytics'
import './GetStarted.css'

// Signup flow for the text-first pivot, wired to oro-central's public
// onboarding endpoints (BUI-415): POST /onboarding/start sends the OTP,
// POST /onboarding/verify creates the account and triggers the opening text.
// One question per screen; region + age gates are surfaced client-side only
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
  const screenRef = useRef(null)
  const validationFocusRef = useRef('')

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

  useEffect(() => {
    const target = screenRef.current?.querySelector('[data-initial-focus="true"]')
      || screenRef.current?.querySelector('h1')
    target?.focus()
  }, [view])

  useEffect(() => {
    if (!error || !validationFocusRef.current) return
    document.getElementById(validationFocusRef.current)?.focus()
    validationFocusRef.current = ''
  }, [error])

  const set = (key) => (value) => {
    setNotice('')
    if (
      (key === 'name' && value.trim())
      || (key === 'birthday' && ageFromISO(value) !== null && ageFromISO(value) >= 0)
      || (key === 'province' && (form.country === 'CA' ? PROVINCES : US_STATES)
        .some(([province]) => province === value))
      || (key === 'phone' && /^(?:\d{10}|1\d{10})$/.test(value.trim()))
      || key === 'hearOther'
    ) setError('')
    setForm((f) => ({ ...f, [key]: value }))
  }

  const qIndex = QUESTIONS.indexOf(view)
  const onQuestion = qIndex !== -1

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
    setNotice(resend ? 'sending a new code…' : 'sending your verification code…')
    try {
      const { status, detail } = await postJSON('/onboarding/start', {
        name: form.name,
        birthday: form.birthday.replaceAll('/', '-'),
        // The server takes a country + its subdivision. `form.province` holds
        // whichever list the chosen country showed (provinces or US states).
        country: form.country,
        state: form.province,
        heard_about: [
          ...form.hear,
          form.hear.includes('somewhere else') ? form.hearOther.trim() : '',
        ].filter(Boolean).join(', '),
        // No consent flag: the notice above this screen's submit button is the
        // disclosure and sending the number is the acceptance, which the server
        // timestamps on receipt. A hardcoded `true` asserted nothing.
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
        setNotice('')
        setError(detail.toLowerCase() || 'that doesn’t look quite right — check it and try again.')
      } else if (status === 429) {
        setNotice('')
        setError('too many tries — wait a moment and try again.')
      } else {
        setNotice('')
        setError('couldn’t send the code — try again in a bit.')
      }
    } catch {
      setNotice('')
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
    setNotice('checking your code…')
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
        setNotice('')
        setError(/phone/i.test(detail) ? 'invalid phone number.' : 'that code didn’t match — double-check and try again.')
      } else {
        setNotice('')
        setError('couldn’t check the code — try again in a bit.')
      }
    } catch {
      setNotice('')
      setError('couldn’t reach oro — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const advance = () => {
    if (loading) return
    const fail = (message, fieldId) => {
      setNotice('')
      validationFocusRef.current = fieldId
      setError(message)
      if (error === message) document.getElementById(fieldId)?.focus()
      return true
    }

    if (view === 'name' && !form.name.trim()) {
      if (fail('Enter your first name.', 'gs-name')) return
    }
    if (view === 'birthday' && (ageFromISO(form.birthday) === null || ageFromISO(form.birthday) < 0)) {
      if (fail('Enter a valid birthday in the past using year, month, and day.', 'gs-birthday-year')) return
    }
    if (view === 'province' && !form.country) {
      if (fail('Choose Canada or United States.', 'gs-country-ca')) return
    }
    if (view === 'province' && !(form.country === 'CA' ? PROVINCES : US_STATES)
      .some(([province]) => province === form.province)) {
      if (fail(`Choose your ${form.country === 'CA' ? 'province or territory' : 'state'}.`, 'gs-location')) return
    }
    if (view === 'hear' && form.hear.length === 0) {
      if (fail('Choose at least one option.', 'gs-hear-instagram')) return
    }
    if (view === 'phone' && !/^(?:\d{10}|1\d{10})$/.test(form.phone.trim())) {
      if (fail('Enter a 10-digit phone number, or 11 digits starting with 1.', 'gs-phone')) return
    }
    if (view === 'otp' && !/^\d{6}$/.test(code.trim())) {
      if (fail('Enter the 6-digit code we texted you.', 'gs-otp')) return
    }

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
    setError('')
    setNotice('')
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
    <div className="gs" data-view={view}>
      {/* Top bar: back + progress. Only shown on the question screens. */}
      {onQuestion && (
        <div className="gs-bar">
          <BackButton onPress={back} accessibilityLabel="go back" />
          <progress
            className="gs-progress"
            value={qIndex + 1}
            max={QUESTIONS.length}
            aria-label="Signup progress"
            aria-valuetext={`Step ${qIndex + 1} of ${QUESTIONS.length}`}
          />
          <span className="gs-progress-count" aria-hidden="true">
            <span className="gs-progress-current">{qIndex + 1}</span>
            <span className="gs-progress-of"> / <span className="gs-progress-total">{QUESTIONS.length}</span></span>
          </span>
        </div>
      )}

      <div className="gs-stage">
        <div className="gs-screen" key={view} data-dir={dir} ref={screenRef}>
          {view === 'welcome' && (
            <Welcome onStart={advance} />
          )}

          {view === 'name' && (
            <Question
              id="name"
              label="first — what should I call you?"
              hint="just your first name is perfect."
              onContinue={advance}
              error={error}
            >
              <label className="gs-field-label" htmlFor="gs-name">
                first name <span>(required)</span>
              </label>
              <TextField
                id="gs-name"
                name="given-name"
                value={form.name}
                onChange={set('name')}
                placeholder="your name"
                autoComplete="given-name"
                maxLength={50}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={`gs-name-hint${error ? ' gs-name-error' : ''}`}
                data-initial-focus="true"
              />
            </Question>
          )}

          {view === 'birthday' && (
            <Question
              id="birthday"
              label="when's your birthday?"
              hint="oro is 16+."
              onContinue={advance}
              error={error}
            >
              <DateField
                value={form.birthday}
                onChange={set('birthday')}
                invalid={Boolean(error)}
                describedBy={`gs-birthday-hint${error ? ' gs-birthday-error' : ''}`}
              />
            </Question>
          )}

          {view === 'hear' && (
            <Question
              id="hear"
              label="how'd you hear about oro?"
              hint="select all that apply."
              onContinue={advance}
              error={error}
            >
              <fieldset
                className="gs-fieldset"
                aria-describedby={`gs-hear-hint${error ? ' gs-hear-error' : ''}`}
              >
                <legend className="gs-field-label">where you heard about oro <span>(required)</span></legend>
                <div className="gs-chips">
                  {HEAR_OPTIONS.map((opt, index) => (
                    <Chip
                      key={opt}
                      id={`gs-hear-${opt.replaceAll(' ', '-')}`}
                      pill
                      selected={form.hear.includes(opt)}
                      aria-invalid={Boolean(error && form.hear.length === 0)}
                      aria-describedby={error ? 'gs-hear-error' : undefined}
                      data-initial-focus={index === 0 ? 'true' : undefined}
                      onClick={() => toggleHear(opt)}
                    >
                      {opt}
                    </Chip>
                  ))}
                </div>
              </fieldset>
              {form.hear.includes('somewhere else') && (
                <div className="gs-other-field">
                  <label className="gs-field-label" htmlFor="gs-hear-other">tell us more <span>(optional)</span></label>
                  <TextField
                    id="gs-hear-other"
                    name="heard-about-other"
                    value={form.hearOther}
                    onChange={set('hearOther')}
                    placeholder="where did you hear about oro?"
                    maxLength={100}
                  />
                </div>
              )}
            </Question>
          )}

          {view === 'province' && (
            <Question
              id="province"
              label="where are you located?"
              hint="coming to other countries soon."
              onContinue={advance}
              error={error}
            >
              <fieldset
                className="gs-fieldset"
                aria-describedby={`gs-province-hint${error ? ' gs-province-error' : ''}`}
              >
                <legend className="gs-field-label">country <span>(required)</span></legend>
                <div className="gs-country-options">
                  {[
                    ['CA', 'canada'],
                    ['US', 'united states'],
                  ].map(([countryCode, name], index) => (
                    <Chip
                      key={countryCode}
                      id={`gs-country-${countryCode.toLowerCase()}`}
                      pill
                      selected={form.country === countryCode}
                      aria-invalid={Boolean(error && !form.country)}
                      aria-describedby={error && !form.country ? 'gs-province-error' : undefined}
                      data-initial-focus={index === 0 ? 'true' : undefined}
                      onClick={() => {
                        setError('')
                        setNotice('')
                        setForm((current) => ({ ...current, country: countryCode, province: '' }))
                      }}
                    >
                      {name}
                    </Chip>
                  ))}
                </div>
              </fieldset>
              {form.country && (
                <Select
                  id="gs-location"
                  label={form.country === 'CA' ? 'province or territory' : 'state'}
                  value={form.province}
                  options={locationOptions}
                  onChange={set('province')}
                  invalid={Boolean(error && form.country && !form.province)}
                  describedBy={error ? 'gs-province-error' : undefined}
                />
              )}
            </Question>
          )}

          {view === 'phone' && (
            <Question
              id="phone"
              label={displayName ? `last thing, ${displayName}.` : 'last thing.'}
              hint="your number"
              onContinue={advance}
              cta={loading ? 'sending' : 'text me'}
              loading={loading}
              error={error}
              notice={notice}
              footer={<ConsentNote />}
            >
              <label className="gs-field-label" htmlFor="gs-phone">
                mobile phone number <span>(required)</span>
              </label>
              <TextField
                id="gs-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(value) => set('phone')(value.replace(/\D/g, '').slice(0, 11))}
                placeholder="15550000000"
                inputMode="tel"
                maxLength={11}
                autoComplete="tel"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={`gs-phone-hint${error ? ' gs-phone-error' : ''}`}
                data-initial-focus="true"
              />
            </Question>
          )}

          {view === 'otp' && (
            <Question
              id="otp"
              label="we just texted you."
              hint={`enter the code we sent to ${form.phone.trim()}.`}
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
              <label className="gs-field-label" htmlFor="gs-otp">
                6-digit verification code <span>(required)</span>
              </label>
              <TextField
                id="gs-otp"
                name="one-time-code"
                value={code}
                onChange={(value) => {
                  setNotice('')
                  const nextCode = value.replace(/\D/g, '').slice(0, 6)
                  if (/^\d{6}$/.test(nextCode)) setError('')
                  setCode(nextCode)
                }}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="gs-input gs-input-otp"
                required
                aria-invalid={Boolean(error)}
                aria-describedby={`gs-otp-hint${error ? ' gs-otp-error' : ''}`}
                data-initial-focus="true"
              />
            </Question>
          )}

          {view === 'done' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">you're in.</p>
              <h1 className="gs-terminal-title" tabIndex={-1}>
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
              <h1 className="gs-terminal-title" tabIndex={-1}>
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
              <h1 className="gs-terminal-title" tabIndex={-1}>
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
              <h1 className="gs-terminal-title" tabIndex={-1}>
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
              <h1 className="gs-terminal-title" tabIndex={-1}>
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
    </div>
  )
}

function Welcome({ onStart }) {
  return (
    <div className="gs-welcome">
      <p className="gs-eyebrow">your stylist, on demand.</p>
      <h1 className="gs-welcome-title" tabIndex={-1}>
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
  id, label, hint, children, onContinue, cta = 'continue', footer,
  loading = false, error = '', notice = '',
}) {
  return (
    <form
      className="gs-question"
      noValidate
      aria-labelledby={`gs-${id}-title`}
      aria-busy={loading}
      onSubmit={(event) => {
        event.preventDefault()
        onContinue()
      }}
    >
      <h1 className="gs-q-label" id={`gs-${id}-title`} tabIndex={-1}>{label}</h1>
      {hint && <p className="gs-q-hint" id={`gs-${id}-hint`}>{hint}</p>}
      <div className="gs-q-field">{children}</div>
      <p className="gs-notice" role="status">{notice}</p>
      <p className="gs-error" id={`gs-${id}-error`} role="status">{error}</p>
      {footer && <div className="gs-consent">{footer}</div>}
      <Cta
        type="submit"
        size="full"
        inverse
        className="gs-cta"
        data-loading={loading}
        disabled={loading}
      >
        {cta}{loading ? '…' : '.'}
      </Cta>
    </form>
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
        <a href="/terms" target="_blank" rel="noopener noreferrer">
          terms of service<span className="gs-visually-hidden"> (opens in a new tab)</span>
        </a> and{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">
          privacy policy<span className="gs-visually-hidden"> (opens in a new tab)</span>
        </a>, and
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

function TextField({ value, onChange, className = 'gs-input', ...rest }) {
  return (
    <input
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  )
}

// A native <select>: the options popup anchors to the control (not a bottom
// sheet) and the OS supplies keyboard + screen-reader behaviour. `required`
// pairs with the :invalid rule so the empty placeholder renders as muted.
// Kept in sync with .gs-select-list max-height in GetStarted.css — the flip
// decision needs the panel's height before it is rendered.
const PANEL_MAX_HEIGHT = 264

// An anchored listbox. A native <select> was tried first and rejected: macOS
// draws its popup in the *control's* font, so the 28px editorial trigger blew
// the option list up into a full-page overlay. Owning the panel keeps the
// trigger large and the options at a sane reading size — and unlike the OS
// menu, it can actually be seen and tested.
function Select({ id, label, value, options, onChange, invalid = false, describedBy }) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  const selectedIndex = options.findIndex(([code]) => code === value)
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex][1] : 'select…'
  const labelId = `${id}-label`
  const valueId = `${id}-value`
  const listId = `${id}-list`
  const optionId = (code) => `${id}-option-${code.toLowerCase()}`

  // Pointer-down rather than click: closing on click would swallow the press
  // that opened a different control.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    const onFocusIn = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [open])

  // Keep the highlighted row in view when arrowing past the scroll edge.
  useEffect(() => {
    if (!open || activeIndex < 0) return
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  // This field sits low on the screen, so a panel that always drops down gets
  // clipped by the viewport. Flip above when there isn't room below and there
  // is more room above.
  const openWith = (index) => {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (rect) {
      const below = window.innerHeight - rect.bottom
      setDropUp(below < PANEL_MAX_HEIGHT + 16 && rect.top > below)
    }
    setActiveIndex(index)
    setOpen(true)
  }

  const commit = (index) => {
    onChange(options[index][0])
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openWith(selectedIndex >= 0 ? selectedIndex : 0)
      } else if (e.key.length === 1 && /\S/.test(e.key)) {
        const match = options.findIndex((option) => option[1].toLowerCase().startsWith(e.key.toLowerCase()))
        if (match >= 0) {
          e.preventDefault()
          openWith(match)
        }
      }
      return
    }
    if (e.key === 'Tab') {
      setOpen(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(options.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (activeIndex >= 0) commit(activeIndex)
    } else if (e.key.length === 1 && /\S/.test(e.key)) {
      const start = Math.max(activeIndex, -1)
      const match = options.findIndex((option, index) => (
        index > start && option[1].toLowerCase().startsWith(e.key.toLowerCase())
      ))
      const wrappedMatch = match >= 0
        ? match
        : options.findIndex((option) => option[1].toLowerCase().startsWith(e.key.toLowerCase()))
      if (wrappedMatch >= 0) {
        e.preventDefault()
        setActiveIndex(wrappedMatch)
      }
    }
  }

  return (
    <div className="gs-select-field" ref={wrapRef}>
      <label className="gs-select-label" id={labelId} htmlFor={id}>{label} <span>(required)</span></label>
      <button
        id={id}
        type="button"
        ref={triggerRef}
        className="gs-select-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(options[activeIndex][0]) : undefined}
        aria-labelledby={`${labelId} ${valueId}`}
        aria-required="true"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        onClick={() => (open ? setOpen(false) : openWith(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={onKeyDown}
      >
        <span id={valueId} className={selectedIndex >= 0 ? undefined : 'gs-select-placeholder'}>
          {selectedLabel}
        </span>
        <svg className="gs-select-chevron" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <polyline points="3,6 8,11 13,6" />
        </svg>
      </button>
      {open && (
        <ul
          id={listId}
          className={`gs-select-list${dropUp ? ' is-above' : ''}`}
          role="listbox"
          aria-labelledby={labelId}
          ref={listRef}
          tabIndex={-1}
        >
          {options.map(([code, name], i) => (
            <li
              key={code}
              id={optionId(code)}
              role="option"
              aria-selected={i === selectedIndex}
              className={[
                'gs-select-option',
                i === activeIndex ? 'is-active' : '',
                i === selectedIndex ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              // Move, not enter: a cursor parked over the panel would otherwise
              // re-claim the highlight on every keyboard-driven re-render.
              onMouseMove={() => setActiveIndex(i)}
              onClick={() => commit(i)}
            >
              <span>{name}</span>
              {i === selectedIndex ? <span className="gs-select-check" aria-hidden="true">✓</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function DateField({ value, onChange, invalid = false, describedBy }) {
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
    <fieldset className="gs-date-field" aria-describedby={describedBy}>
      <legend className="gs-field-label">birthday <span>(required)</span></legend>
      <div className="gs-date-parts" onPaste={handlePaste}>
        <div className="gs-date-part">
          <label htmlFor="gs-birthday-year">year</label>
          <input
            id="gs-birthday-year"
            name="birthday-year"
            ref={yearRef}
            value={year}
            onChange={(event) => updatePart(0, event.target.value)}
            placeholder="yyyy"
            inputMode="numeric"
            autoComplete="bday-year"
            maxLength={4}
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            data-initial-focus="true"
          />
        </div>
        <span aria-hidden="true">/</span>
        <div className="gs-date-part">
          <label htmlFor="gs-birthday-month">month</label>
          <input
            id="gs-birthday-month"
            name="birthday-month"
            ref={monthRef}
            value={month}
            onChange={(event) => updatePart(1, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !month) yearRef.current?.focus()
            }}
            placeholder="mm"
            inputMode="numeric"
            autoComplete="bday-month"
            maxLength={2}
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </div>
        <span aria-hidden="true">/</span>
        <div className="gs-date-part">
          <label htmlFor="gs-birthday-day">day</label>
          <input
            id="gs-birthday-day"
            name="birthday-day"
            ref={dayRef}
            value={day}
            onChange={(event) => updatePart(2, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Backspace' && !day) monthRef.current?.focus()
            }}
            placeholder="dd"
            inputMode="numeric"
            autoComplete="bday-day"
            maxLength={2}
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        </div>
      </div>
      <input
        className="gs-date-picker"
        type="date"
        value={/^\d{4}\/\d{2}\/\d{2}$/.test(value) ? value.replaceAll('/', '-') : ''}
        onChange={(event) => onChange(event.target.value.replaceAll('-', '/'))}
        aria-label="choose birthday from calendar"
        aria-invalid={invalid}
        aria-describedby={describedBy}
      />
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      </svg>
    </fieldset>
  )
}
