import './WaitlistModal.css';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function WaitlistModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [alreadyOnList, setAlreadyOnList] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) return

    setLoading(true)
    setError(null)

    const { error: dbError } = await supabase
      .from('waitlist')
      .insert([{ email: cleanEmail }])

    if (dbError) {
      if (dbError.code === '23505') {
        setAlreadyOnList(true)
        setLoading(false)
        return
      }
      setError('Something went wrong. Try again.')
      setLoading(false)
      return
    }

    try {
      await fetch(import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      })
    } catch (err) {
      console.error('Sheets error:', err)
    }

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-x" onClick={onClose} aria-label="Close">✕</button>

        {success ? (
          <div className="modal-success">
            <div className="success-check">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">You're on the list</p>
            <h3>We'll be in touch.</h3>
            <p className="modal-subtitle">You'll be among the first to experience Oro.</p>
            <button className="modal-done-btn" onClick={onClose}>Done</button>
          </div>
        ) : alreadyOnList ? (
          <div className="modal-success">
            <div className="success-check">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3.5 9.5L7 13L14.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="modal-eyebrow">Already registered</p>
            <h3>You're already in.</h3>
            <p className="modal-subtitle">You'll be one of the first to get access to Oro — no need to sign up again.</p>
            <button className="modal-done-btn" onClick={onClose}>Got it</button>
          </div>
        ) : (
          <>
            <p className="modal-eyebrow">Early access</p>
            <h3>Join the waitlist</h3>
            <p className="modal-subtitle">Be first to know when we launch.</p>

            <form onSubmit={handleSubmit} className="email-form">
              <input
                type="email"
                className="email-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="email-submit-btn" disabled={loading} aria-label="Join waitlist">
                {loading ? (
                  <span className="btn-spinner" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </form>

            {error && <p className="modal-error">{error}</p>}
            <p className="modal-fine">No spam. Unsubscribe anytime.</p>
          </>
        )}
      </div>
    </div>
  )
}
