import { useEffect, useRef, useState } from 'react'
import { Button, Heading, Notice, Text, TextField } from 'oro-kit'
import BetaIntroduction, { TypedText } from './BetaIntroduction'
import { choices, emptyAnswers, formSteps, textLimits, validateAnswers } from './betaForm'
import { saveBetaRequest, submissionMessages } from './betaSubmission'
import './Beta.css'

const previewForm = import.meta.env.DEV || __BETA_FORM_PREVIEW__

function Choices({ name, value, update, error, multiple = false, optional = false, disabled = false }) {
  return (
    <>
      <Text variant="support" muted className="beta-choice-hint">{multiple ? 'Select all that apply.' : 'Choose one.'}</Text>
      <div className="beta-choices">
        {choices[name].map((option, index) => (
          <label className="beta-option" key={option}>
            <input type={multiple ? 'checkbox' : 'radio'} id={`${name}-${index}`} name={name} value={option}
              disabled={disabled} required={!optional && !multiple}
              checked={multiple ? value.includes(option) : value === option}
              aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-error` : undefined}
              onChange={() => update(name, multiple ? (value.includes(option) ? value.filter((item) => item !== option) : [...value, option]) : option)} />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {optional && value && <Button variant="tertiary" disabled={disabled} onClick={() => { update(name, ''); document.getElementById(`${name}-0`)?.focus() }}>Clear answer</Button>}
      {error && <p id={`${name}-error`} className="oro-field__error">{error}</p>}
    </>
  )
}

function WrittenAnswer({ name, label, value, update, error, hint, multiline = false, optional = false, ...props }) {
  const common = { id: name, name, value, onChange: (event) => update(name, event.target.value), maxLength: textLimits[name] || 2000, required: !optional, ...props }
  if (!multiline) return <TextField {...common} label={label} hint={hint} error={error} />
  return (
    <div className="oro-field">
      <label className="oro-field__label" htmlFor={name}>{label}</label>
      <textarea {...common} className="oro-input beta-textarea" rows={4} aria-invalid={error ? true : undefined}
        aria-describedby={[hint && `${name}-hint`, error && `${name}-error`, `${name}-count`].filter(Boolean).join(' ')} />
      {hint && <p className="oro-field__hint" id={`${name}-hint`}>{hint}</p>}
      <div className="beta-field-footer">{error && <p className="oro-field__error" id={`${name}-error`}>{error}</p>}<span id={`${name}-count`}>{value.length.toLocaleString()} / 2,000</span></div>
    </div>
  )
}

export default function Beta() {
  const [answers, setAnswers] = useState(emptyAnswers)
  const [attemptedSteps, setAttemptedSteps] = useState([])
  const [status, setStatus] = useState('idle')
  const [enabled, setEnabled] = useState(false)
  const [requestId, setRequestId] = useState(null)
  const submissionKey = useRef(null)
  const submitting = useRef(false)
  const allowForm = previewForm || enabled
  const entryView = allowForm ? 'form' : 'coming-soon'
  const saving = status === 'saving'
  const message = submissionMessages[status]
  const [view, setView] = useState('story')
  const [step, setStep] = useState(0)
  const formRef = useRef(null)
  const stepTitleRef = useRef(null)
  const receiptRef = useRef(null)
  const statusRef = useRef(null)
  const comingSoonRef = useRef(null)
  const pendingFocus = useRef(null)
  const stepInfo = formSteps[step]
  const finalStep = step === formSteps.length - 1
  const errors = attemptedSteps.includes(step)
    ? Object.fromEntries(Object.entries(validateAnswers(answers)).filter(([name]) => stepInfo.fields.includes(name)))
    : {}

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/beta-request', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (!controller.signal.aborted) setEnabled(result?.enabled === true) })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    document.title = 'Help us make Oro yours. — Oro beta'
    const syncLocation = () => {
      const index = formSteps.findIndex((item) => item.hash === window.location.hash)
      if (index >= 0) {
        setStep(index)
        setView(entryView)
      } else {
        setView('story')
      }
    }
    syncLocation()
    window.addEventListener('popstate', syncLocation)
    window.addEventListener('hashchange', syncLocation)
    return () => {
      window.removeEventListener('popstate', syncLocation)
      window.removeEventListener('hashchange', syncLocation)
    }
  }, [entryView])

  useEffect(() => {
    if (view !== 'form') return
    const frame = requestAnimationFrame(() => {
      if (pendingFocus.current) formRef.current?.querySelector(`[name="${pendingFocus.current}"]`)?.focus()
      else {
        stepTitleRef.current?.focus({ preventScroll: true })
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
      pendingFocus.current = null
    })
    return () => cancelAnimationFrame(frame)
  }, [view, step])
  useEffect(() => { if (view === 'receipt') receiptRef.current?.focus() }, [view])
  useEffect(() => {
    if (view !== 'coming-soon') return
    comingSoonRef.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [view])
  useEffect(() => { if (status !== 'idle' && !saving) statusRef.current?.focus() }, [status, saving])

  function update(name, value) {
    if (submitting.current) return
    setAnswers((current) => ({ ...current, [name]: value }))
    setStatus('idle')
  }

  function openStep(index) {
    if (submitting.current) return
    window.history.pushState(null, '', formSteps[index].hash)
    setStep(index)
    setView(entryView)
  }

  function openStory() {
    if (submitting.current) return
    window.history.pushState(null, '', window.location.pathname)
    setView('story')
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  async function submit(event) {
    event.preventDefault()
    if (!allowForm || submitting.current) return
    if (finalStep && !answers.terms) return
    const invalid = validateAnswers(answers)
    const checkedSteps = finalStep ? formSteps.map((_, index) => index) : [step]
    const invalidStep = checkedSteps.find((index) => formSteps[index].fields.some((name) => invalid[name]))
    if (invalidStep !== undefined) {
      setAttemptedSteps((current) => [...new Set([...current, invalidStep])])
      const name = formSteps[invalidStep].fields.find((field) => invalid[field])
      pendingFocus.current = name
      if (invalidStep !== step) openStep(invalidStep)
      else requestAnimationFrame(() => {
        formRef.current?.querySelector(`[name="${name}"]`)?.focus()
        pendingFocus.current = null
      })
      return
    }
    if (!finalStep) { openStep(step + 1); return }
    if (!enabled) { setStatus('unavailable'); return }
    if (!submissionKey.current || status === 'submission_conflict') submissionKey.current = crypto.randomUUID()
    submitting.current = true
    setStatus('saving')
    const result = await saveBetaRequest(answers, submissionKey.current)
    submitting.current = false
    if (result.requestId) {
      setRequestId(result.requestId)
      setStatus('idle')
      setView('receipt')
    } else setStatus(result.code)
  }

  const field = (name, label, props = {}) => <WrittenAnswer name={name} label={label} value={answers[name]} update={update} error={errors[name]} disabled={saving} {...props} />
  const options = (name, props = {}) => <Choices name={name} value={answers[name]} update={update} error={errors[name]} disabled={saving} {...props} />

  const questionContent = [
    field('name', 'Your name', { autoComplete: 'name', placeholder: 'Your name', wrapperClassName: 'beta-name-field' }),
    <>
      <div className="beta-contact-fields">{field('email', 'Email address', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}{field('phone', 'Phone number', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+1 416 555 0123' })}</div>
      {field('instagram', <>Instagram handle <span className="beta-optional">Optional</span></>, { optional: true, autoCapitalize: 'none', autoCorrect: 'off', placeholder: '@yourhandle', maxLength: 31, hint: 'We’re making an Instagram group chat for our original Oronauts so you can meet other testers, share your experiences, and have some fun together. Leave your handle if you’d like an invite :)' })}
    </>,
    options('usedOro'),
    options('outfitDays'),
    <>{field('occasion', 'What were you getting dressed for?')}{field('uncertainty', 'What were you unsure about?')}</>,
    field('challenges', 'Your experience', { multiline: true }),
    <>{options('usualHelp', { multiple: true })}{answers.usualHelp.includes('Other') && <div className="beta-follow-up">{field('usualHelpOther', 'What else do you do?')}</div>}</>,
    field('hopes', 'What you have in mind', { multiline: true }),
    field('week', 'Your plans', { multiline: true, hint: 'Tell us everything! School, work, seeing friends, any plans or events—anything you’ll be getting dressed for.' }),
    field('location', 'City and province', { placeholder: 'Toronto, Ontario' }),
    options('age', { optional: true }),
    <>{options('gender', { optional: true })}{answers.gender === 'I’d like to self-describe' && <div className="beta-follow-up">{field('genderDescription', <>How would you describe your gender? <span className="beta-optional">Optional</span></>, { optional: true })}</div>}</>,
    <>{options('source')}{answers.source === 'Other' && <div className="beta-follow-up">{field('sourceOther', 'Where did you hear about it?')}</div>}</>,
  ]

  return (
    <div className={`beta-page beta-page--${view} ph-no-capture`} data-private="true">
      <header className="halo-header beta-header"><div className="halo-container halo-header-inner">
        <a className="halo-logo-link" href="/" aria-label="Oro home"><img className="halo-logo" src="/static/oro-logo.png" alt="Oro" width="80" height="32" /></a>
        <nav className="halo-nav" aria-label="Beta"><span className="beta-header-note">Made with you, for you.</span>
          {view === 'story' ? <a className="oro-button oro-button--secondary" href="#request" onClick={(event) => { event.preventDefault(); openStep(step) }}>{allowForm ? 'Skip to the form' : 'Beta invites'} <span aria-hidden="true">↗</span></a>
            : <Button variant="tertiary" disabled={saving} onClick={openStory}>Back to the invitation</Button>}
        </nav>
      </div></header>
      {previewForm && !enabled && <div className="beta-draft-bar"><div className="halo-container"><span>Design preview · Nothing is sent or saved</span><button onClick={() => setView(view === 'receipt' ? 'form' : 'receipt')}>{view === 'receipt' ? 'Back to form' : 'Preview confirmation'} <span aria-hidden="true">↗</span></button></div></div>}
      {view === 'story' && <BetaIntroduction onStart={() => openStep(step)} previewForm={allowForm} />}
      {view === 'coming-soon' && <section className="beta-application beta-coming-soon" aria-labelledby="coming-soon-title">
        <div className="beta-story-halo" aria-hidden="true" />
        <div className="beta-form-panel beta-form-heading">
          <Heading ref={comingSoonRef} tabIndex={-1} as="h1" variant="title" id="coming-soon-title"><TypedText duration={1000} delay="60ms" caret>Invites open <em>soon.</em></TypedText></Heading>
          <Text muted>We’re getting ready to welcome our first Oronauts. Check back soon to request your invite.</Text>
          <a className="oro-button oro-button--secondary" href="mailto:sunny@buildingoro.ca">Email us <span aria-hidden="true">↗</span></a>
        </div>
      </section>}
      {allowForm && view === 'form' && <section className="beta-application" aria-labelledby="request-title" data-scene={step % 3}>
        <div className="beta-story-halo" aria-hidden="true" />
        <div className="beta-form-progress" role="progressbar" aria-label="Invite request progress" aria-valuemin={0} aria-valuemax={formSteps.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${formSteps.length}`}><span style={{ width: `${(step + 1) / formSteps.length * 100}%` }} /></div>
        <div className="beta-form-panel" key={step}>
          <div className="beta-form-heading">
            <Heading ref={stepTitleRef} tabIndex={-1} as="h1" variant="title" id="request-title"><TypedText duration={Math.min(1200, stepInfo.title.length * 24)} delay="60ms" caret>{stepInfo.title}</TypedText></Heading>
            {stepInfo.optional && <Text variant="support" muted>Optional</Text>}
            {stepInfo.description && <Text muted>{stepInfo.description}</Text>}
          </div>
          <form ref={formRef} onSubmit={submit} aria-busy={saving} noValidate className="beta-form" aria-label="Beta invite request">
            {!finalStep && <fieldset className="beta-question" aria-labelledby="request-title"><div className="beta-question-body">{questionContent[step]}</div></fieldset>}
            {finalStep && <div className="beta-consent" id="before-send">
              <Text variant="support" muted>We’ll review your responses and email you if you’re selected.</Text>
              {status === 'unavailable' && <div ref={statusRef} tabIndex={-1}><Notice tone="error" title="This draft isn’t connected yet.">Nothing was submitted. Your answers are still here. Use “Preview confirmation” above to review the receipt design.</Notice></div>}
              {message && <div ref={statusRef} tabIndex={-1}><Notice tone="error" title={message[0]}>{message[1]}</Notice></div>}
              <Button type="submit" className="beta-submit" disabled={!answers.terms || saving}>{saving ? 'Saving your request…' : status === 'submission_conflict' ? 'Send updated request' : 'Request an invite'} <span aria-hidden="true">↗</span></Button>
              <div className="beta-consent-options">
                <label><input type="checkbox" disabled={saving} name="terms" required checked={answers.terms} onChange={(event) => update('terms', event.target.checked)} aria-invalid={errors.terms ? true : undefined} aria-describedby={errors.terms ? 'terms-error' : undefined} /><span>By submitting this request, I agree to Oro’s <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a>.</span></label>
                {errors.terms && <p id="terms-error" className="oro-field__error">{errors.terms}</p>}
                <label><input type="checkbox" disabled={saving} name="futureBeta" checked={answers.futureBeta} onChange={(event) => update('futureBeta', event.target.checked)} /><span>If I’m not invited to this beta, Oro can email or text me about future beta opportunities. I can unsubscribe at any time.</span></label>
                <label><input type="checkbox" disabled={saving} name="marketing" checked={answers.marketing} onChange={(event) => update('marketing', event.target.checked)} /><span>I’d like to receive marketing emails and texts from Oro, including product updates and promotions. I can unsubscribe at any time.</span></label>
              </div>
              <Text variant="support" muted>Read our <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a> to learn how we handle your information.</Text>
            </div>}
            <div className="beta-step-actions"><Button variant="tertiary" className="beta-form-back" disabled={saving} onClick={() => step > 0 ? openStep(step - 1) : openStory()}>← {step > 0 ? 'Back' : 'The invitation'}</Button>{!finalStep && <button type="submit" className="beta-page-arrow beta-form-next" aria-label="Continue"><span aria-hidden="true">→</span></button>}</div>
          </form>
          <Text variant="support" muted className="beta-form-help">Questions? <a href="mailto:sunny@buildingoro.ca">Email us</a></Text>
        </div>
      </section>}
      {allowForm && view === 'receipt' && <section className="beta-receipt halo-container" ref={receiptRef} tabIndex={-1} aria-labelledby="receipt-title">
        {!requestId && <Text variant="label" muted>Confirmation preview · No request has been saved</Text>}
        <span className="beta-receipt-icon" aria-hidden="true">✓</span>
        <Heading as="h1" variant="display" id="receipt-title">Request <em>received :)</em></Heading>
        <Text muted>Thanks for helping us make Oro yours. We’ll review your responses and email you if you’re selected for the September 26–October 1 beta.</Text>
        <Text variant="label" muted>Questions or concerns? Email <a href="mailto:sunny@buildingoro.ca">sunny@buildingoro.ca</a>.</Text>
        {requestId ? <Text variant="support" muted>Request reference: {requestId}</Text> : <Button variant="secondary" onClick={() => setView('form')}>Back to the draft</Button>}
      </section>}
    </div>
  )
}
