import { useEffect, useRef, useState } from 'react'
import { Button, Heading, Notice, Text, TextField } from 'oro-kit'
import ButtonArrow from '../ButtonArrow'
import { HomeFooter, HomeHeader } from '../home/HomeChrome'
import { clearBetaDraft, readBetaDraft, writeBetaDraft } from './betaDraft'
import { emptyAnswers, formSteps, textLimits, validateAnswers } from './betaForm'
import { findExistingBetaRequest, saveBetaRequest, submissionMessages } from './betaSubmission'
import { CAMPAIGN_SOURCE, REFERRAL_CODE } from '../../lib/betaContract'
import { createReceiptStory, downloadReceiptStory } from './receiptStory'
import { messagesInvite } from './referralShare'
import './Beta.css'

const previewForm = import.meta.env.DEV || __BETA_FORM_PREVIEW__
function CopyIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="8" y="4" width="11" height="13" rx="2" /><path d="M16 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" /></svg> }
function DownloadIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3" /></svg> }
function WrittenAnswer({ name, label, value, update, error, ...props }) {
  return <TextField id={name} name={name} label={label} value={value} onChange={(event) => update(name, event.target.value)} maxLength={textLimits[name] || 64} required error={error} {...props} />
}

export default function Beta() {
  const [draft] = useState(readBetaDraft)
  const [campaignSource] = useState(() => {
    if (draft?.campaignSource) return draft.campaignSource
    if (typeof window === 'undefined') return ''
    const source = new URL(window.location.href).searchParams.get('src') || ''
    return CAMPAIGN_SOURCE.test(source) ? source : ''
  })
  const [answers, setAnswers] = useState(draft?.answers ?? emptyAnswers)
  const [code, setCode] = useState('')
  const [phoneProof, setPhoneProof] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('idle')
  const [attemptedSteps, setAttemptedSteps] = useState([])
  const [status, setStatus] = useState('idle')
  const [enabled, setEnabled] = useState(false)
  const [requestId, setRequestId] = useState(null)
  const [signupNumber, setSignupNumber] = useState(null)
  const [ownReferralCode, setOwnReferralCode] = useState(null)
  const [referredSignups, setReferredSignups] = useState(0)
  const [referralCompletedDate, setReferralCompletedDate] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [copied, setCopied] = useState(false)
  const [messagesHref, setMessagesHref] = useState('')
  const [storyImage, setStoryImage] = useState(null)
  const [incomingReferralCode] = useState(() => {
    if (typeof window === 'undefined') return ''
    const code = new URL(window.location.href).searchParams.get('ref') || ''
    return REFERRAL_CODE.test(code) ? code : ''
  })
  const submissionKey = useRef(draft?.submissionKey ?? null)
  const copyTimeout = useRef(null)
  const submitting = useRef(false)
  const verifying = useRef(false)
  const currentPhone = useRef(answers.phone)
  const currentCode = useRef(code)
  const currentStep = useRef(0)
  const allowForm = previewForm || enabled
  const entryView = allowForm ? 'form' : 'coming-soon'
  const saving = status === 'saving'
  const message = submissionMessages[status]
  const [view, setView] = useState(entryView)
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
    if (answers !== emptyAnswers) writeBetaDraft(answers, submissionKey.current, campaignSource)
  }, [answers, campaignSource])
  useEffect(() => () => clearTimeout(copyTimeout.current), [])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/beta-request', { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => { if (!controller.signal.aborted) setEnabled(result?.enabled === true) })
      .catch(() => { })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    document.title = 'help us make oro yours. - oro'
    const syncLocation = () => {
      const url = new URL(window.location.href)
      const requestedStep = url.searchParams.get('step') || url.hash.slice(1)
      const index = formSteps.findIndex((item) => item.hash.slice(1) === requestedStep)
      if (index >= 0) {
        if (!url.searchParams.has('step')) {
          url.searchParams.set('step', requestedStep)
          url.hash = ''
          window.history.replaceState(null, '', `${url.pathname}${url.search}`)
        }
        currentStep.current = index
        setStep(index)
        setView(entryView)
      } else {
        url.searchParams.set('step', formSteps[0].hash.slice(1))
        url.hash = ''
        window.history.replaceState(null, '', `${url.pathname}${url.search}`)
        currentStep.current = 0
        setStep(0)
        setView(entryView)
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
    if (name === 'phone') { currentPhone.current = value; currentCode.current = ''; setCode(''); setPhoneProof(''); setVerificationStatus('idle') }
    setStatus('idle')
  }

  function openStep(index) {
    if (submitting.current) return
    const url = new URL(window.location.href)
    url.searchParams.set('step', formSteps[index].hash.slice(1))
    url.hash = ''
    window.history.pushState(null, '', `${url.pathname}${url.search}`)
    currentStep.current = index
    setStep(index)
    setView(entryView)
  }

  async function verifyPhone(action) {
    if (verifying.current) return false
    verifying.current = true
    const phone = answers.phone
    const submittedCode = code
    const sourceStep = step
    setVerificationStatus(action === 'start' ? 'sending' : 'checking')
    try {
      const response = await fetch('/api/beta-verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, phone, ...(action === 'check' ? { code: submittedCode } : {}) }),
      })
      const result = await response.json()
      if (currentPhone.current !== phone || currentCode.current !== submittedCode || currentStep.current !== sourceStep) return false
      if (response.ok && result.ok && action === 'start') { setVerificationStatus('sent'); return true }
      if (response.ok && result.ok && action === 'check' && result.proof) {
        const existing = await findExistingBetaRequest(phone, result.proof)
        if (existing.found) {
          clearBetaDraft()
          setPhoneProof(result.proof)
          setRequestId(existing.requestId)
          setSignupNumber(existing.signupNumber)
          setOwnReferralCode(existing.referralCode)
          setReferredSignups(existing.referredSignups)
          setReferralCompletedDate(existing.referralCompletedDate)
          setStoryImage(null)
          setVerificationStatus('verified')
          setView('receipt')
          return { ok: true, existing: true }
        }
        setPhoneProof(result.proof); setVerificationStatus('verified'); return { ok: true, existing: false }
      }
      setVerificationStatus(result.code === 'invalid_code' ? 'invalid' : result.code === 'rate_limited' ? 'rate_limited' : 'unavailable')
    } catch { if (currentPhone.current === phone && currentStep.current === sourceStep) setVerificationStatus('unavailable') }
    finally { verifying.current = false }
    return false
  }

  async function submit(event) {
    event.preventDefault()
    if (!allowForm || submitting.current) return
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
    if (step === 0) {
      if (previewForm && !enabled) { openStep(1); return }
      if (await verifyPhone('start')) openStep(1)
      return
    }
    if (step === 1) {
      if (previewForm && !enabled) { openStep(2); return }
      const verification = await verifyPhone('check')
      if (verification?.ok && !verification.existing) openStep(2)
      return
    }
    if (finalStep && !enabled) { setStatus('unavailable'); return }
    if (finalStep && !phoneProof) { openStep(1); return }
    if (!finalStep) { openStep(step + 1); return }
    if (!submissionKey.current || status === 'submission_conflict') submissionKey.current = crypto.randomUUID()
    writeBetaDraft(answers, submissionKey.current, campaignSource)
    submitting.current = true
    setStatus('saving')
    const result = await saveBetaRequest(answers, submissionKey.current, fetch, incomingReferralCode, phoneProof, campaignSource)
    submitting.current = false
    if (result.requestId) {
      clearBetaDraft()
      setRequestId(result.requestId)
      setSignupNumber(result.signupNumber)
      setOwnReferralCode(result.referralCode)
      setReferredSignups(0)
      setReferralCompletedDate('')
      setStoryImage(null)
      setStatus('idle')
      setView('receipt')
    } else setStatus(result.code)
  }

  const field = (name, label, props = {}) => <WrittenAnswer name={name} label={label} value={answers[name]} update={update} error={errors[name]} disabled={saving} {...props} />
  const inviteLink = ownReferralCode ? `${window.location.origin}/invite?ref=${ownReferralCode}` : ''
  const referralCompleted = Boolean(referralCompletedDate)
  useEffect(() => { setMessagesHref(messagesInvite(inviteLink, navigator.userAgent)) }, [inviteLink])
  const previewReceipt = (completed = false) => {
    setRequestId(null)
    setSignupNumber(completed ? 11 : null)
    setOwnReferralCode(null)
    setReferredSignups(completed ? 3 : 0)
    setReferralCompletedDate(completed ? 'preview' : '')
    setView('receipt')
  }
  useEffect(() => {
    if (view !== 'receipt') return
    let active = true
    let imageUrl
    setStoryImage(null)
    setShareMessage('')
    createReceiptStory(inviteLink, signupNumber).then((blob) => {
      if (!active) return
      imageUrl = URL.createObjectURL(blob)
      setStoryImage({ blob, url: imageUrl })
    }).catch(() => { if (active) { setStoryImage(null); setShareMessage('Could not prepare the share image. Try downloading it again.') } })
    return () => { active = false; if (imageUrl) URL.revokeObjectURL(imageUrl) }
  }, [view, inviteLink, signupNumber])
  async function copyInvite() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 2000)
      setShareMessage('Invite link copied.')
    }
    catch { setShareMessage('Could not copy the link. Please try again.') }
  }
  async function saveStory() {
    try { downloadReceiptStory(storyImage?.blob ?? await createReceiptStory(inviteLink, signupNumber)); setShareMessage('Story image downloaded.') }
    catch { setShareMessage('Could not download the story image. Please try again.') }
  }
  const questionContent = [
    <>{field('phone', 'Phone number', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '+1 416 555 0123', disabled: verificationStatus === 'sending' })}{['unavailable', 'rate_limited'].includes(verificationStatus) && step === 0 && <p className="oro-field__error" role="status">{verificationStatus === 'rate_limited' ? 'Please wait a minute before requesting another code.' : 'We couldn’t send a code. Try again.'}</p>}</>,
    <>
      <Text muted>Enter the code we sent to {answers.phone}.</Text>
      <WrittenAnswer name="code" label="Verification code" value={code} update={(_, value) => { const next = value.replace(/\D/g, '').slice(0, 10); currentCode.current = next; setCode(next); setVerificationStatus('sent') }} error={verificationStatus === 'invalid' ? 'That code is incorrect or has expired. Try again or request a new code.' : undefined} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" disabled={verificationStatus === 'checking' || verificationStatus === 'sending'} />
      {['unavailable', 'rate_limited'].includes(verificationStatus) && step === 1 && <p className="oro-field__error" role="status">{verificationStatus === 'rate_limited' ? 'Please wait a minute before trying again.' : 'We couldn’t check the code. Try again.'}</p>}
      <button type="button" className="beta-resend" disabled={verificationStatus === 'sending' || verificationStatus === 'checking'} onClick={() => verifyPhone('start')}>Send a new code</button>
    </>,
    <>{field('name', 'Your name', { autoComplete: 'name', placeholder: 'Your name' })}{field('email', 'Email address', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}</>,
  ]

  return (
    <div className={`beta-page beta-page--${view} ph-no-capture`} data-private="true">
      <HomeHeader />
      {previewForm && !enabled && <div className="beta-draft-bar"><div className="halo-container"><span>Design preview · Nothing is submitted</span>{view === 'receipt' ? <button onClick={() => setView('form')}>Back to form <span data-button-icon="up-right" aria-hidden="true">↗</span></button> : <><button onClick={() => previewReceipt()}>Preview confirmation <span data-button-icon="up-right" aria-hidden="true">↗</span></button>{import.meta.env.DEV && <button onClick={() => previewReceipt(true)}>Preview referral milestone <span data-button-icon="up-right" aria-hidden="true">↗</span></button>}</>}</div></div>}
      {view === 'coming-soon' && <section className="beta-application beta-coming-soon" aria-labelledby="coming-soon-title">
        <div className="beta-story-halo" aria-hidden="true" />
        <div className="beta-form-panel beta-form-heading">
          <Heading ref={comingSoonRef} tabIndex={-1} as="h1" variant="title" id="coming-soon-title">Invites open <em>soon.</em></Heading>
          <Text muted>We’re getting ready to welcome our first oronauts. Check back soon to request your invite.</Text>
          <a className="oro-button oro-button--secondary" href="mailto:sunny@buildingoro.ca">Email us <ButtonArrow direction="up-right" /></a>
        </div>
      </section>}
      {allowForm && view === 'form' && <section className="beta-application" aria-labelledby="request-title" data-scene={step % 3}>
        <div className="beta-story-halo" aria-hidden="true" />
        <div className="beta-form-progress" role="progressbar" aria-label="Invite request progress" aria-valuemin={0} aria-valuemax={formSteps.length} aria-valuenow={step + 1} aria-valuetext={`Step ${step + 1} of ${formSteps.length}`}><span style={{ width: `${(step + 1) / formSteps.length * 100}%` }} /></div>
        <div className="beta-form-panel" key={step}>
          <div className="beta-form-heading">
            <Heading ref={stepTitleRef} tabIndex={-1} as="h1" variant="title" id="request-title">{stepInfo.title}</Heading>
            {stepInfo.optional && <Text variant="support" muted>Optional</Text>}
            {stepInfo.description && <Text muted>{stepInfo.description}</Text>}
            {step === 0 && <Text muted>already signed up? verify your number to check your place.</Text>}
          </div>
          <form ref={formRef} onSubmit={submit} aria-busy={saving} noValidate className="beta-form" aria-label="Invite request">
            <fieldset className="beta-question" aria-labelledby="request-title"><div className="beta-question-body">{questionContent[step]}</div></fieldset>
            {finalStep && <div className="beta-consent" id="before-send">
              {status === 'unavailable' && <div ref={statusRef} tabIndex={-1}><Notice tone="error" title="This draft isn’t connected yet.">Nothing was submitted. Your answers are still here. Use “Preview confirmation” above to review the receipt design.</Notice></div>}
              {message && <div ref={statusRef} tabIndex={-1}><Notice tone="error" title={message[0]}>{message[1]}</Notice></div>}
              <Button type="submit" className="beta-submit" disabled={!answers.terms || saving}>{saving ? 'Saving your request…' : status === 'submission_conflict' ? 'Send updated request' : 'Request an invite'} <ButtonArrow direction="up-right" /></Button>
              <Text variant="support" muted>By submitting this request, I agree to oro’s <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>, and to receive marketing emails and texts from oro, including product updates and promotions. I can unsubscribe at any time.</Text>
            </div>}
            <div className="beta-step-actions">{step > 0 && <button type="button" className="beta-page-arrow beta-form-back" aria-label="Back" disabled={saving || verificationStatus === 'sending' || verificationStatus === 'checking'} onClick={() => openStep(step - 1)}><ButtonArrow direction="left" size={18} /></button>}{!finalStep && <button type="submit" className="beta-page-arrow beta-form-next" aria-label="Continue" disabled={verificationStatus === 'sending' || verificationStatus === 'checking'}><ButtonArrow size={18} /></button>}</div>
          </form>
          <Text variant="support" muted className="beta-form-help">Questions? <a href="mailto:sunny@buildingoro.ca">Email us</a></Text>
        </div>
      </section>}
      {allowForm && view === 'receipt' && <section className="beta-receipt halo-container" ref={receiptRef} tabIndex={-1} aria-labelledby="receipt-title">
        {!requestId && <p className="beta-receipt-preview">Confirmation preview · No request has been saved</p>}
        <div className={`beta-receipt-hero${referralCompleted ? ' beta-receipt-hero--completed' : ''}`}>
          <div className="beta-receipt-intro">
            {referralCompleted ? <><h1 id="receipt-title">look who’s <em>moving up.</em></h1><p className="beta-referral-complete-copy">thanks for bringing your friends. you’re now <strong>#{signupNumber} in line</strong> to meet oro.</p></> : <h1 id="receipt-title">i’m {Number.isSafeInteger(signupNumber) && signupNumber > 0 && <><em>#{signupNumber}</em> </>}in line<br />to meet oro</h1>}
            <p className="beta-referral-count" role="status">{referredSignups === 0 ? '0 of 3 friends have joined' : `${referredSignups} ${referredSignups === 1 ? 'friend' : 'friends'} joined.${referredSignups < 3 ? ` ${3 - referredSignups} to go.` : ''}`}</p>
            {!referralCompleted && <div className="beta-rewards">
              <h2>want to move up?</h2>
              <p>know someone who’d love oro? share your invite. when 3 sign up through your link, we’ll move you to the front.</p>
            </div>}
            <div className="beta-referral-actions">
              {messagesHref && <a className="oro-button oro-button--primary" href={messagesHref}>share in messages</a>}
              <Button variant="tertiary" className="beta-hero-invite" onClick={copyInvite} disabled={!inviteLink}><span>{copied ? 'copied!' : 'copy my invite link'}</span><CopyIcon /></Button>
              <a className="beta-resend" href="/beta?step=phone">check my place</a>
            </div>
            {requestId && <p className="beta-request-reference">Request reference: {requestId}</p>}
          </div>
          {!referralCompleted && <div className="beta-story-preview">{storyImage ? <img src={storyImage.url} alt="Share image with the cheeky Oro mascot, referral message, and invite link" /> : <div className="beta-story-skeleton" role="status" aria-label={shareMessage.startsWith('Could not prepare') ? 'Image unavailable' : 'Preparing image'} />}<Button variant="tertiary" onClick={saveStory} aria-label="Download image" disabled={!storyImage && !shareMessage.startsWith('Could not prepare')}><DownloadIcon /></Button>{shareMessage.startsWith('Could not') && <p>{shareMessage}</p>}</div>}
        </div>
      </section>}
      {allowForm && view === 'receipt' && <HomeFooter landing closerTitle="good style looks better together" closerText={null} closerAction={<><button type="button" className="oro-button oro-button--primary halo-cta halo-cta--closer" onClick={copyInvite} disabled={!inviteLink}>copy my invite link</button><p className="beta-footer-message" role="status">{shareMessage || (!inviteLink && 'check back later :(')}</p></>} />}
    </div>
  )
}
