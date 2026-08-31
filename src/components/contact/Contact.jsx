import { Cta } from '@oro/web'
import signature from '../../assets/contact/signature.png'
import { useState } from 'react'
import './Contact.css'

// /contact — "a letter to oro." Two facing sheets of stationery: oro's
// pre-printed letter on the left, the visitor's blank form on the right.
// Theme-aware via --color-* tokens; the stationery sheets are warm paper in
// both themes.

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
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      })
      if (!res.ok) { setStatus('error'); return }
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="ct-sheet ct-sheet--you ct-sheet--sent">
        <p className="ct-sent-line">✓ on its way. we’ll write back.</p>
      </div>
    )
  }

  return (
    <form className="ct-sheet ct-sheet--you" onSubmit={handleSubmit} noValidate>
      <div className="ct-meta">
        <span className="ct-meta-plum">your letter</span>
        <span className="ct-meta-gold">not yet sent</span>
      </div>

      <p className="ct-salutation">dear oro,</p>

      <textarea
        className="ct-textarea"
        placeholder="(write anything… we read everything.)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={9}
      />
      {touched && !message.trim() && <p className="ct-help">a few words?</p>}

      <p className="ct-signoff">yours,</p>

      <div className="ct-sender">
        <div className="ct-field">
          <input
            type="text"
            className="ct-input"
            placeholder="your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {touched && !name.trim() && <p className="ct-help">your name?</p>}
        </div>
        <div className="ct-field">
          <input
            type="email"
            className="ct-input"
            placeholder="where to reach you (email)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {touched && !email.trim() && <p className="ct-help">where to reach you?</p>}
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

      <p className="ct-reassure">we reply within a day or two, in writing. no auto-responder.</p>
    </form>
  )
}

export default function Contact() {
  return (
    <main className="ct">
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
            <img className="ct-signature" src={signature} alt="Sunny Wu" />
            <p className="ct-signoff-name">sunny wu &middot; founder &amp; ceo</p>
          </div>

          {/* Right — visitor's form */}
          <VisitorForm />
        </div>
      </section>
    </main>
  )
}
