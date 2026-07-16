import { useMemo, useRef, useState } from 'react'
import './GetStarted.css'

// Static, front-end-only signup flow for the text-first pivot. Mirrors the
// Figma "First time discovery flow" landing-page portion: collect the four
// things we need before handing off to SMS (name, birthday, referral, phone),
// one question per screen. No backend — submitting just advances to the
// "check your texts" confirmation. Wire the phone → SMS handoff later.

// Ordered question screens. Drives the progress bar + next/back navigation.
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

export default function GetStarted() {
  // 'welcome' → question screens → 'done'; 'ineligible' is a dead-end branch.
  const [view, setView] = useState('welcome')
  const [form, setForm] = useState({ name: '', birthday: '', hear: '', phone: '' })

  // Direction the last transition moved, so the content can slide the right way.
  const [dir, setDir] = useState('fwd')

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
      default: return true
    }
  }, [view, form])

  const goTo = (next, direction = 'fwd') => {
    setDir(direction)
    setView(next)
  }

  const restart = () => {
    setForm({ name: '', birthday: '', hear: '', phone: '' })
    goTo('welcome', 'back')
  }

  const advance = () => {
    if (!canContinue) return
    // Birthday gate: under-16 diverts to the ineligible dead-end.
    if (view === 'birthday' && ageFromISO(form.birthday) < MIN_AGE) {
      goTo('ineligible')
      return
    }
    if (view === 'welcome') { goTo(QUESTIONS[0]); return }
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
              cta="text me"
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

function Question({ label, hint, children, canContinue, onContinue, cta = 'continue', footer }) {
  return (
    <div className="gs-question">
      <h1 className="gs-q-label">{label}</h1>
      {hint && <p className="gs-q-hint">{hint}</p>}
      <div className="gs-q-field">{children}</div>
      {footer && <div className="gs-consent">{footer}</div>}
      <button
        type="button"
        className="gs-cta"
        onClick={onContinue}
        disabled={!canContinue}
      >
        {cta}.
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
        <a href="/privacy" target="_blank" rel="noopener noreferrer">privacy policy</a>.
      </p>
      <p className="gs-consent-line">
        you're also opting in to recurring automated texts from oro at this number — it's how oro
        styles you. msg &amp; data rates may apply, frequency varies. reply STOP to opt out, HELP for
        help.
      </p>
    </>
  )
}

function TextField({ value, onChange, onEnter, autoFocus, ...rest }) {
  const ref = useRef(null)
  return (
    <input
      ref={ref}
      className="gs-input"
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
