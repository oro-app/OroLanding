import { Button, Chip, Heading, Text } from 'oro-kit'
import { useState } from 'react'
import './Contact.css'

const TOPICS = ['hello', 'support', 'press', 'partnership', 'careers', 'feedback']

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  )
}

function VisitorForm() {
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('hello')
  const [status, setStatus] = useState('idle') // idle | submitting | sent | error
  const [touched, setTouched] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (!name.trim() || !email.trim() || !message.trim()) return

    setStatus('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), topic, message: message.trim() }),
      })
      if (!res.ok) { setStatus('error'); return }
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="oro-card ct-sheet ct-sheet--you ct-sheet--sent">
        <p className="ct-sent-line" role="status">✓ On its way. We’ll write back.</p>
      </div>
    )
  }

  return (
    <form className="oro-card ct-sheet ct-sheet--you" onSubmit={handleSubmit} noValidate>
      <div className="ct-meta">
        <span className="ct-meta-plum">Your letter</span>
        <span className="ct-meta-gold">Not yet sent</span>
      </div>

      <p className="ct-salutation">Dear Oro,</p>

      <textarea
        className="oro-input ct-textarea"
        placeholder="(Write anything… we read everything.)"
        aria-label="Your letter"
        aria-required="true"
        aria-invalid={touched && !message.trim() ? true : undefined}
        aria-describedby={touched && !message.trim() ? 'contact-message-help' : undefined}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={9}
      />
      {touched && !message.trim() && <p className="ct-help" id="contact-message-help">A few words?</p>}

      <p className="ct-signoff">Yours,</p>

      <div className="ct-sender">
        <div className="ct-field">
          <input
            type="text"
            className="oro-input ct-input"
            placeholder="Your name"
            aria-label="Your name"
            autoComplete="name"
            aria-required="true"
            aria-invalid={touched && !name.trim() ? true : undefined}
            aria-describedby={touched && !name.trim() ? 'contact-name-help' : undefined}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {touched && !name.trim() && <p className="ct-help" id="contact-name-help">Your name?</p>}
        </div>
        <div className="ct-field">
          <input
            type="email"
            className="oro-input ct-input"
            placeholder="Where to reach you (email)"
            aria-label="Where to reach you (email)"
            autoComplete="email"
            aria-required="true"
            aria-invalid={touched && !email.trim() ? true : undefined}
            aria-describedby={touched && !email.trim() ? 'contact-email-help' : undefined}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {touched && !email.trim() && <p className="ct-help" id="contact-email-help">Where to reach you?</p>}
        </div>
      </div>

      <div className="ct-chips" role="group" aria-label="Kind of letter">
        <span className="ct-chips-label">Kind of letter</span>
        <div className="ct-chips-row">
          {TOPICS.map((t) => (
            <Chip key={t} selected={topic === t} onClick={() => setTopic(t)}>
              {t[0].toUpperCase() + t.slice(1)}.
            </Chip>
          ))}
        </div>
      </div>

      <Button type="submit" className="ct-send" disabled={status === 'submitting'}>
        {status === 'submitting' ? '…Sealing.' : (<>Seal &amp; send <Arrow /></>)}
      </Button>

      {status === 'error' && (
        <p className="ct-error" role="alert">
          Couldn’t send — try again, or email us directly at{' '}
          <a href="mailto:hello@buildingoro.ca">hello@buildingoro.ca</a>.
        </p>
      )}

      <p className="ct-reassure">We reply within a day or two, in writing. No auto-responder.</p>
    </form>
  )
}

export default function Contact() {
  return (
    <div className="ct halo-container">
      {/* Title block */}
      <section className="ct-title-wrap">
        <Text variant="label" muted className="ct-kicker">
          <span className="ct-kicker-dot" aria-hidden="true" />
          Contact &amp; help.
        </Text>
        <Heading as="h1" variant="display" className="ct-title">
          Write to <span className="ct-em">us</span>.<br />
          We’ll write <span className="ct-em">back</span>.
        </Heading>
        <Text muted className="ct-sub">
          A real person reads every letter. It might take a day or two, but you’ll hear back.
        </Text>
      </section>

      {/* The two letters */}
      <section className="ct-letters-wrap">
        <div className="ct-letters">
          {/* Left — oro's pre-printed letter */}
          <div className="oro-card ct-sheet ct-sheet--oro">
            <div className="ct-meta">
              <span>From Oro</span>
              <span>Any day</span>
            </div>
            <p className="ct-salutation">Dear reader,</p>
            <div className="ct-body">
              <p>We read everything that comes through this page. It’s a small team, so the reply isn’t always immediate, but it’s always written by a person.</p>
              <p>Tell us anything — an idea, a bug, a question, a polite complaint.</p>
            </div>
            <p className="ct-signoff-oro">
              Yours,
              <img className="halo-logo ct-signoff-logo" src="/static/oro-logo.png" alt="Oro" width="80" height="32" decoding="async" />
            </p>
          </div>

          {/* Right — visitor's form */}
          <VisitorForm />
        </div>
      </section>

    </div>
  )
}
