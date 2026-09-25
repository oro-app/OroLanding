import { Button, Chip, Heading, TextField as KitTextField } from 'oro-kit'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { postOnboarding } from './onboardingApi'
import GoldBackground from '../GoldBackground'
import './GetStarted.css'

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
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
  ['facebook', 'Facebook'],
  ['a friend', 'A friend'],
  ['google', 'Google'],
  ['app store', 'App Store'],
  ['play store', 'Play Store'],
  ['somewhere else', 'Somewhere else'],
]

// Minimum age — oro is 16+ (hard gate on the Figma flow).
const MIN_AGE = 16

// Draft answers, so an abandoned signup can be resumed; cleared once signup completes.
const DRAFT_KEY = 'oro_get_started_responses'

// Matches the server's resend cooldown on /onboarding/start.
const RESEND_COOLDOWN_SECONDS = 60

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

const PROBLEMS = {
  invite: { title: 'An invitation comes first.', body: 'This phone number needs an approved beta invitation. Already invited? Use the number on your invitation, or email us for help.' },
  conflict: { title: 'Let’s check your account.', body: 'We couldn’t link this invitation to your account. Try your approved phone number again, or email us so we can help.' },
  closed: { title: 'Beta setup isn’t open yet.', body: 'Please come back when setup opens. If you’ve already received an invitation, email us for help.' },
  unavailable: { title: 'Setup is temporarily unavailable.', body: 'We couldn’t check your beta access. Your answers are still here - please try again shortly.' },
  expired: { title: 'Let’s get a fresh code.', body: 'Your setup session has expired. Your answers are still here; request a new verification code to continue.' },
  save: { title: 'We couldn’t finish your setup.', body: 'Your setup hasn’t been confirmed. Your answers are still here; request a new verification code and try again.' },
  connection: { title: 'We lost the connection.', body: 'We couldn’t confirm your setup. Check your connection, then request a new code to continue. Your answers are still here.' },
}

export default function GetStarted() {
  const [view, setView] = useState('welcome')
  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') {
      return { name: '', birthday: '', country: '', province: '', hear: [], hearOther: '', phone: '' }
    }

    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY))
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
  const [problem, setProblem] = useState(null)
  const screenRef = useRef(null)

  useEffect(() => {
    screenRef.current?.querySelector('h1')?.focus()
  }, [view])

  // Seconds left before /start may be re-called for a fresh code.
  const [resendLeft, setResendLeft] = useState(0)
  const [verifyLeft, setVerifyLeft] = useState(0)

  // Direction the last transition moved, so the content can slide the right way.
  const [dir, setDir] = useState('fwd')

  useEffect(() => {
    if (resendLeft <= 0 && verifyLeft <= 0) return undefined
    const t = setTimeout(() => {
      setResendLeft((s) => Math.max(0, s - 1))
      setVerifyLeft((s) => Math.max(0, s - 1))
    }, 1000)
    return () => clearTimeout(t)
  }, [resendLeft, verifyLeft])

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
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
      case 'otp': return code.length === 6 && verifyLeft === 0
      default: return true
    }
  }, [view, form, code, verifyLeft])

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

  const showProblem = (kind) => {
    setCode('')
    setProblem(kind)
    goTo('problem')
  }

  const handleAccessError = ({ status, code, detail }, verifying = false) => {
    if (code === 'beta_invite_required') showProblem('invite')
    else if (status === 409) showProblem('conflict')
    else if (status === 410) showProblem('expired')
    else if (status === 503) showProblem(/not open/i.test(detail) ? 'closed' : verifying ? 'save' : 'unavailable')
    else if (status === 403 && /16 and up/i.test(detail)) goTo('ineligible')
    else if (status === 403 && /quebec/i.test(detail)) goTo('region-ineligible')
    else return false
    return true
  }

  const startSignup = async ({ resend = false } = {}) => {
    if (loading || resendLeft > 0) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const response = await postOnboarding('start', {
        name: form.name,
        birthday: form.birthday.replaceAll('/', '-'),
        country: form.country,
        state: form.province,
        heard_about: [
          ...form.hear,
          form.hear.includes('somewhere else') ? form.hearOther.trim() : '',
        ].filter(Boolean).join(', '),
        phone: form.phone.trim(),
      })
      const { status, result, detail, retryAfter } = response
      if (status === 200 && result === 'otp_sent') {
        setCode('')
        setResendLeft(RESEND_COOLDOWN_SECONDS)
        goTo('otp')
        if (resend) setNotice('New code sent.')
      } else if (handleAccessError(response)) {
        return
      } else if (status === 429 && (response.code === 'otp_cooldown' || /already sent/i.test(detail))) {
        setResendLeft(retryAfter)
        goTo('otp')
        setNotice('A code was already sent. Use that one, or wait to request a new one.')
      } else if (status === 429) {
        setResendLeft(retryAfter)
        setError('Too many tries. Please wait before requesting another code.')
      } else if (status === 400 || status === 422) {
        setError(/phone/i.test(detail) ? 'Check your phone number, including its country code.' : 'Check your answers and try again.')
      } else {
        setError('We couldn’t confirm that a code was sent. Please try again.')
      }
    } catch {
      setError('We couldn’t reach Oro. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (loading || verifyLeft > 0) return
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const response = await postOnboarding('verify', { phone: form.phone.trim(), code: code.trim() })
      if (response.status === 200 && response.result === 'verified') {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {
          // Setup still completes when browser storage is unavailable.
        }
        setCode('')
        goTo('done')
      } else if (handleAccessError(response, true)) {
        return
      } else if (response.status === 400) {
        setError('That code didn’t match or has expired. Check it, or request a new code below.')
      } else if (response.status === 429) {
        setVerifyLeft(response.retryAfter)
        setError('Too many verification attempts. Please wait a moment and try again.')
      } else {
        showProblem('save')
      }
    } catch {
      showProblem('connection')
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
    <section className="gs ph-no-capture" data-private data-view={view} aria-busy={loading}>
      <GoldBackground />
      {/* Top bar: back + progress. Only shown on the question screens. */}
      {onQuestion && (
        <div className="gs-bar">
          <Button variant="tertiary" onClick={back} disabled={loading} aria-label="Go back">←</Button>
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
        <div className="gs-screen" key={view} data-dir={dir} ref={screenRef}>
          {view === 'welcome' && (
            <Welcome onStart={advance} />
          )}

          {view === 'name' && (
            <Question
              label="First - what should I call you?"
              hint="Just your first name is perfect."
              canContinue={canContinue}
              onContinue={advance}
            >
              <TextField
                label="First name"
                value={form.name}
                onChange={set('name')}
                onEnter={advance}
                placeholder="Your name"
                autoComplete="given-name"
                autoCapitalize="words"
                maxLength={50}
              />
            </Question>
          )}

          {view === 'birthday' && (
            <Question
              label="When's your birthday?"
              hint="Oro is 16+."
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
              label="How'd you hear about Oro?"
              hint="Select all that apply."
              canContinue={canContinue}
              onContinue={advance}
            >
              <div className="gs-chips">
                {HEAR_OPTIONS.map(([opt, label]) => (
                  <Chip key={opt} selected={form.hear.includes(opt)} onClick={() => toggleHear(opt)}>
                    {label}
                  </Chip>
                ))}
              </div>
              {form.hear.includes('somewhere else') && (
                <TextField
                  label="Where did you hear about Oro?"
                  value={form.hearOther}
                  onChange={set('hearOther')}
                  onEnter={advance}
                  placeholder="Tell us more (optional)"
                  autoCapitalize="sentences"
                  maxLength={100}
                  aria-label="Tell us where you heard about Oro"
                />
              )}
            </Question>
          )}

          {view === 'province' && (
            <Question
              label="Where are you located?"
              hint="Coming to other countries soon."
              canContinue={canContinue}
              onContinue={advance}
            >
              <div className="gs-country-options">
                {[
                  ['CA', 'Canada'],
                  ['US', 'United States'],
                ].map(([code, name]) => (
                  <Chip
                    key={code}
                    selected={form.country === code}
                    onClick={() => {
                      setForm((current) => ({ ...current, country: code, province: '' }))
                    }}
                  >
                    {name}
                  </Chip>
                ))}
              </div>
              {form.country && (
                <Select
                  label={form.country === 'CA' ? 'Province or territory' : 'State'}
                  value={form.province}
                  options={locationOptions}
                  onChange={set('province')}
                />
              )}
            </Question>
          )}

          {view === 'phone' && (
            <Question
              label={displayName ? `Last thing, ${displayName}.` : 'Last thing.'}
              hint="Use the phone number on your approved beta invitation."
              canContinue={canContinue && resendLeft === 0}
              onContinue={advance}
              cta={loading ? 'Sending' : resendLeft > 0 ? `Send code in ${resendLeft}s` : 'Send verification code'}
              loading={loading}
              error={error}
              footer={<ConsentNote />}
            >
              <TextField
                label="Phone number"
                disabled={loading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "gs-error" : undefined}
                type="tel"
                value={form.phone}
                onChange={(value) => { set('phone')(value); setResendLeft(0) }}
                onEnter={advance}
                placeholder="+1 555 000 0000"
                inputMode="tel"
                maxLength={32}
                autoComplete="tel"
                autoCapitalize="none"
              />
            </Question>
          )}

          {view === 'otp' && (
            <Question
              label="We just texted you."
              hint={`Enter the code we sent to ${form.phone.trim()}.`}
              canContinue={canContinue}
              onContinue={advance}
              cta={loading ? 'Checking' : verifyLeft > 0 ? `Try again in ${verifyLeft}s` : 'Verify'}
              loading={loading}
              error={error}
              notice={notice}
              footer={
                <p className="gs-consent-line">
                  Didn&rsquo;t get it?{' '}
                  <button
                    type="button"
                    className="gs-resend"
                    disabled={resendLeft > 0 || loading}
                    onClick={() => startSignup({ resend: true })}
                  >
                    {resendLeft > 0 ? `Resend in ${resendLeft}s` : 'Resend code'}
                  </button>
                  <button type="button" className="gs-change-phone" disabled={loading} onClick={() => { setCode(''); goTo('phone', 'back') }}>
                    Change phone number
                  </button>
                </p>
              }
            >
              <TextField
                label="Verification code"
                disabled={loading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "gs-error" : undefined}
                value={code}
                onChange={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
                onEnter={advance}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoCapitalize="none"
                maxLength={6}
                className="gs-input-otp"
              />
            </Question>
          )}

          {view === 'done' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">Welcome, Oronaut.</p>
              <Heading as="h1" variant="title" tabIndex={-1} className="gs-terminal-title">You’re all set.</Heading>
              <p className="gs-terminal-sub">Your beta setup is complete. Send Oro your first text to get started.</p>
              <a className="oro-button oro-button--primary gs-cta" href="sms:+18556762419">Start texting Oro</a>
              <p className="gs-terminal-sub">On your computer? Text +1 (855) 676-2419 from your phone.</p>
              <a className="gs-textlink" href="mailto:sunny@buildingoro.ca">Questions? Email us</a>
            </div>
          )}

          {view === 'problem' && (
            <div className="gs-terminal">
              <Heading as="h1" variant="title" tabIndex={-1} className="gs-terminal-title">{PROBLEMS[problem].title}</Heading>
              <p className="gs-terminal-sub">{PROBLEMS[problem].body}</p>
              {problem === 'invite' && <a className="oro-button oro-button--primary gs-cta" href="/beta">Request an invite</a>}
              <Button className="gs-cta" variant="secondary" onClick={() => goTo('phone', 'back')}>
                {problem === 'invite' || problem === 'conflict' ? 'Use a different number' : 'Back to phone verification'}
              </Button>
              <a className="gs-textlink" href="mailto:sunny@buildingoro.ca">Email us for help</a>
            </div>
          )}

          {view === 'ineligible' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">So close.</p>
              <Heading as="h1" variant="title" tabIndex={-1} className="gs-terminal-title">
                Oro is <span className="gs-em">16+</span> for now.
              </Heading>
              <p className="gs-terminal-sub">
                Come back in a bit - we'll be here, and we'll have a fit waiting.
              </p>
              <button type="button" className="gs-textlink" onClick={restart}>
                Start over
              </button>
            </div>
          )}

          {view === 'region-ineligible' && (
            <div className="gs-terminal">
              <p className="gs-eyebrow">Not there just yet.</p>
              <Heading as="h1" variant="title" tabIndex={-1} className="gs-terminal-title">
                Oro isn't available in <span className="gs-em">Quebec</span> yet.
              </Heading>
              <p className="gs-terminal-sub">
                We're working on it - check back soon.
              </p>
              <button type="button" className="gs-textlink" onClick={restart}>
                Start over
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Welcome({ onStart }) {
  return (
    <div className="gs-welcome">
      <Heading as="h1" variant="display" tabIndex={-1} className="gs-welcome-title" aria-label="You’re in.">
        <span aria-hidden="true">
          {[...'You’re in.'].map((letter, index) => (
            <span key={index} className="gs-welcome-char" style={{ '--letter-delay': `${100 + index * 85}ms` }}>{letter}</span>
          ))}
        </span>
      </Heading>
      <div className="gs-welcome-details">
        <p className="gs-welcome-greeting">Welcome to the first crew of Oronauts.</p>
        <p className="gs-welcome-sub">
          We’re so glad you’re here. You’ll get to try Oro early, meet the people building it,
          and help shape what it becomes.
        </p>
        <p className="gs-welcome-signoff">
          See you inside,<br /><span>Sunny &amp; the Oro team</span>
        </p>
        <Button className="gs-cta" onClick={onStart}>
          Let’s get you settled <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  )
}

function Question({
  label, hint, children, canContinue, onContinue, cta = 'Continue', footer,
  loading = false, error = '', notice = '',
}) {
  return (
    <div className="gs-question">
      <Heading as="h1" variant="title" tabIndex={-1} className="gs-q-label">{label}</Heading>
      {hint && <p className="gs-q-hint">{hint}</p>}
      <div className="gs-q-field">{children}</div>
      {notice ? <p className="gs-notice" role="status">{notice}</p> : null}
      {error ? <p id="gs-error" className="gs-error" role="alert">{error}</p> : null}
      {footer && <div className="gs-consent">{footer}</div>}
      <Button
        className="gs-cta"
        data-loading={loading}
        disabled={!canContinue || loading}
        onClick={onContinue}
      >
        {cta}{loading ? '…' : '.'}
      </Button>
    </div>
  )
}

function ConsentNote() {
  return (
    <>
      <p className="gs-consent-line">
        By entering your number, you agree to Oro's{' '}
        <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and{' '}
        <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>, and
        confirm that you are not a resident of Quebec.
      </p>
      <p className="gs-consent-line">
        You're also opting in to recurring automated texts from Oro at this number - it's how Oro
        styles you. Msg &amp; data rates may apply, frequency varies. Reply STOP to opt out, HELP for
        help.
      </p>
    </>
  )
}

function TextField({ value, onChange, onEnter, ...rest }) {
  return (
    <KitTextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onEnter?.()
      }}
      {...rest}
    />
  )
}

// Flip the list above the field when the viewport cannot fit it below.
const PANEL_MAX_HEIGHT = 264

function Select({ label, value, options, onChange }) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)
  const listRef = useRef(null)

  const selectedIndex = options.findIndex(([code]) => code === value)
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex][1] : 'Select…'

  // Pointer-down rather than click: closing on click would swallow the press
  // that opened a different control.
  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
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
    }
  }

  return (
    <div className="gs-select-field" ref={wrapRef}>
      <span className="gs-select-label" id={`${id}-label`}>
        {label}
      </span>
      <button
        type="button"
        ref={triggerRef}
        className="gs-select-trigger"
        role="combobox"
        aria-controls={`${id}-list`}
        aria-activedescendant={open && activeIndex >= 0 ? `${id}-${activeIndex}` : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label`}
        onClick={() => (open ? setOpen(false) : openWith(selectedIndex >= 0 ? selectedIndex : 0))}
        onKeyDown={onKeyDown}
      >
        <span className={selectedIndex >= 0 ? undefined : 'gs-select-placeholder'}>
          {selectedLabel}
        </span>
        <svg className="gs-select-chevron" viewBox="0 0 16 16" aria-hidden="true">
          <polyline points="3,6 8,11 13,6" />
        </svg>
      </button>
      {open && (
        <ul
          className={`gs-select-list${dropUp ? ' is-above' : ''}`}
          id={`${id}-list`}
          aria-labelledby={`${id}-label`}
          role="listbox"
          ref={listRef}
          tabIndex={-1}
        >
          {options.map(([code, name], i) => (
            <li
              key={code}
              id={`${id}-${i}`}
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
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
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
          placeholder="YYYY"
          inputMode="numeric"
          autoComplete="bday-year"
          maxLength={4}
          aria-label="Birth year"
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
          placeholder="MM"
          inputMode="numeric"
          autoComplete="bday-month"
          maxLength={2}
          aria-label="Birth month"
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
          placeholder="DD"
          inputMode="numeric"
          autoComplete="bday-day"
          maxLength={2}
          aria-label="Birth day"
        />
      </div>
      <input
        className="gs-date-picker"
        type="date"
        value={/^\d{4}\/\d{2}\/\d{2}$/.test(value) ? value.replaceAll('/', '-') : ''}
        onChange={(event) => onChange(event.target.value.replaceAll('-', '/'))}
        aria-label="Open birthday date picker"
        tabIndex={-1}
      />
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
      </svg>
    </div>
  )
}
