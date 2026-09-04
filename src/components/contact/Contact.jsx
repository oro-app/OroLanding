import { Cta } from '@oro/web'
import signature from '../../assets/contact/signature.webp'
import { useEffect, useRef, useState } from 'react'
import './Contact.css'

// /contact — "a letter to oro." Two facing sheets of stationery: oro's
// pre-printed letter on the left, the visitor's blank form on the right.
// Theme-aware via --color-* tokens; the stationery sheets are warm paper in
// both themes.

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function VisitorForm() {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | sent | error
  const [errors, setErrors] = useState({})
  const [validationAttempt, setValidationAttempt] = useState(0)
  const errorSummaryRef = useRef(null)
  const sentHeadingRef = useRef(null)

  useEffect(() => {
    if (validationAttempt) errorSummaryRef.current?.focus()
  }, [validationAttempt])

  useEffect(() => {
    if (status === 'sent') sentHeadingRef.current?.focus()
  }, [status])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {}
    const emailInput = e.currentTarget.elements.email

    if (!message.trim()) nextErrors.message = 'Enter a message.'
    if (!name.trim()) nextErrors.name = 'Enter your name.'
    if (!email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!emailInput.validity.valid) nextErrors.email = 'Enter an email address in the format name@example.com.'

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setValidationAttempt((attempt) => attempt + 1)
      return
    }

    setErrors({})

    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      })
      if (!res.ok) { setStatus('error'); return }
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  const errorCount = Object.values(errors).filter(Boolean).length

  if (status === 'sent') {
    return (
      <div className="ct-sheet ct-sheet--you ct-sheet--sent">
        <h2 ref={sentHeadingRef} tabIndex="-1" className="ct-sent-line"><span aria-hidden="true">✓ </span>on its way. we’ll write back.</h2>
      </div>
    )
  }

  return (
    <form className="ct-sheet ct-sheet--you" onSubmit={handleSubmit} noValidate aria-busy={status === 'submitting'}>
      <div className="ct-meta">
        <span className="ct-meta-plum">your letter</span>
        <span className="ct-meta-gold">not yet sent</span>
      </div>

      {errorCount > 0 && (
        <div ref={errorSummaryRef} className="ct-error-summary" tabIndex="-1" aria-labelledby="contact-error-heading">
          <h2 id="contact-error-heading">There {errorCount === 1 ? 'is' : 'are'} {errorCount} {errorCount === 1 ? 'error' : 'errors'}</h2>
          <ul>
            {errors.message && <li><a href="#contact-message" onClick={(e) => { e.preventDefault(); document.getElementById('contact-message').focus() }}>Message: {errors.message}</a></li>}
            {errors.name && <li><a href="#contact-name" onClick={(e) => { e.preventDefault(); document.getElementById('contact-name').focus() }}>Name: {errors.name}</a></li>}
            {errors.email && <li><a href="#contact-email" onClick={(e) => { e.preventDefault(); document.getElementById('contact-email').focus() }}>Email address: {errors.email}</a></li>}
          </ul>
        </div>
      )}

      <p className="ct-salutation">dear oro,</p>

      <label className="ct-label ct-label--message" htmlFor="contact-message">Your message (required)</label>
      <textarea
        id="contact-message"
        name="message"
        className="ct-textarea"
        placeholder="(write anything… we read everything.)"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value)
          setErrors((current) => ({ ...current, message: null }))
        }}
        aria-invalid={errors.message ? 'true' : undefined}
        aria-describedby={errors.message ? 'contact-message-error' : undefined}
        required
        rows={9}
      />
      {errors.message && <p id="contact-message-error" className="ct-help">{errors.message}</p>}

      <p className="ct-signoff">yours,</p>

      <div className="ct-sender">
        <div className="ct-field">
          <label className="ct-label" htmlFor="contact-name">Your name (required)</label>
          <input
            id="contact-name"
            name="name"
            type="text"
            className="ct-input"
            placeholder="your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((current) => ({ ...current, name: null }))
            }}
            autoComplete="name"
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            required
          />
          {errors.name && <p id="contact-name-error" className="ct-help">{errors.name}</p>}
        </div>
        <div className="ct-field">
          <label className="ct-label" htmlFor="contact-email">Email address (required)</label>
          <input
            id="contact-email"
            name="email"
            type="email"
            className="ct-input"
            placeholder="where to reach you (email)"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setErrors((current) => ({ ...current, email: null }))
            }}
            autoComplete="email"
            aria-invalid={errors.email ? 'true' : undefined}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            required
          />
          {errors.email && <p id="contact-email-error" className="ct-help">{errors.email}</p>}
        </div>
      </div>

      <Cta size="block" type="submit" className="ct-send" disabled={status === 'submitting'}>
        {status === 'submitting' ? '…sealing.' : (<>seal &amp; send <Arrow /></>)}
      </Cta>

      {status === 'error' && (
        <p className="ct-error">
          couldn’t send — try again, or email us directly at{' '}
          <a href="mailto:hello@buildingoro.ca">hello@buildingoro.ca</a>.
        </p>
      )}

      <p className="ct-status" role="status">
        {status === 'submitting' ? 'Sending your letter…' : status === 'error' ? 'Your letter could not be sent. Try again or email hello@buildingoro.ca.' : ''}
      </p>

      <p className="ct-reassure">we reply within a day or two, in writing. no auto-responder.</p>
    </form>
  )
}

export default function Contact() {
  return (
    <div className="ct">
      {/* Title block */}
      <section className="ct-title-wrap">
        <p className="ct-kicker">
          <span className="ct-kicker-dot" aria-hidden="true" />
          contact &amp; help.
        </p>
        <h1 className="ct-title">
          write to <span className="ct-em">us</span>.<br />
          we’ll write <span className="ct-em">back</span>.
        </h1>
      </section>

      {/* The two letters */}
      <section className="ct-letters-wrap">
        <div className="ct-letters">
          {/* Left — oro's pre-printed letter */}
          <div className="ct-sheet ct-sheet--oro">
            <div className="ct-meta">
              <span>from oro</span>
              <span>any day</span>
            </div>
            <p className="ct-salutation">dear reader,</p>
            <div className="ct-body">
              <p>we read everything that comes through this page. it’s a small team, so the reply isn’t always immediate, but it’s always written by a person.</p>
              <p>tell us anything — an idea, a bug, a question, a polite complaint. press inquiries, partnerships, hellos, all welcome at the same address.</p>
            </div>
            <p className="ct-signoff-oro">yours,</p>
            <img className="ct-signature" src={signature} alt="Sunny Wu’s signature" />
            <p className="ct-signoff-name">sunny wu &middot; founder &amp; ceo</p>
          </div>

          {/* Right — visitor's form */}
          <VisitorForm />
        </div>
      </section>
    </div>
  )
}
