import { useEffect, useState } from 'react'
import SiteFooter from '../layout/SiteFooter'
import './Contact.css'

// /contact — "a letter to oro." Two facing sheets of stationery: oro's
// pre-printed letter on the left, the visitor's blank form on the right,
// then a postscript FAQ. Theme-aware via --color-* tokens; the stationery
// sheets are warm paper in both themes.

const TOPICS = ['hello', 'support', 'press', 'partnership', 'careers', 'feedback']

const FAQ = [
  { q: 'is oro free?',                 a: 'yes, to start. founders’ pricing for early users; full pricing later.' },
  { q: 'do you sell my closet data?',  a: 'no. never. it stays on your account.' },
  { q: 'when does the app launch?',    a: 'ios + android are live now. there is no waitlist.' },
  { q: 'can i write about oro?',       a: 'yes, please. press kit comes back with your email within a day.' },
  { q: 'are you hiring?',              a: 'occasionally. write us anyway — we keep a list.' },
]

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

      <div className="ct-chips" role="radiogroup" aria-label="kind of letter">
        <span className="ct-chips-label">kind of letter</span>
        <div className="ct-chips-row">
          {TOPICS.map((t) => (
            <button
              type="button"
              key={t}
              className={`ct-chip${topic === t ? ' is-selected' : ''}`}
              role="radio"
              aria-checked={topic === t}
              onClick={() => setTopic(t)}
            >
              {t}.
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="ct-send" disabled={status === 'submitting'}>
        {status === 'submitting' ? '…sealing.' : (<>seal &amp; send <Arrow /></>)}
      </button>

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
  useEffect(() => {
    const prev = document.title
    document.title = 'contact & help — oro'
    return () => { document.title = prev }
  }, [])

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
        <p className="ct-sub">
          a real person reads every letter. it might take a day or two, but you’ll hear back.
        </p>
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
              <p>tell us anything — an idea, a bug, a question, a polite complaint about how the app handles wednesdays. press inquiries, partnerships, hellos, all welcome at the same address.</p>
              <p>if you’d like a faster answer, the short list of common questions on the next page might already cover it.</p>
              <p>otherwise — write us a letter.</p>
            </div>
            <p className="ct-signoff-oro">
              yours,<br />
              <span className="ct-signoff-name">oro.</span>
            </p>
          </div>

          {/* Right — visitor's form */}
          <VisitorForm />
        </div>
      </section>

      {/* Postscript FAQ */}
      <section className="ct-faq-wrap">
        <div className="ct-faq-inner">
          <p className="ct-faq-kicker">postscript — a few things people often ask.</p>
          <div className="ct-faq-list">
            {FAQ.map((row) => (
              <div className="ct-faq-row" key={row.q}>
                <div className="ct-faq-q">{row.q}</div>
                <div className="ct-faq-a">{row.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
