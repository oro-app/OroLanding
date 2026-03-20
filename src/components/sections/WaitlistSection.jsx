import { useState, useEffect, useRef } from 'react'
import useScrollReveal from '../../lib/useScrollReveal'
import WaitlistModal from './WaitlistModal'
import './WaitlistSection.css'

export default function WaitlistSection() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const visible = useScrollReveal(ref, { threshold: 0.25 })

  useEffect(() => {
    // Auto-open modal if returning from OAuth
    if (window.location.hash.includes('access_token')) {
      setOpen(true);
    }
  }, []);

  return (
    <section ref={ref} className="waitlist">
      <div className={`waitlist-inner${visible ? ' visible' : ''}`}>
        <h2 className="waitlist-title" aria-label="Get early access.">
          <span className="waitlist-line waitlist-line-main">Get early</span>
          <span className="waitlist-line waitlist-line-accent">access.</span>
        </h2>
        <p className="waitlist-copy">Join 15K+ people shaping the future of personal style.</p>

        <button
          className="waitlist-btn"
          onClick={() => setOpen(true)}
        >
          Join the waitlist
        </button>
      </div>

      {open && <WaitlistModal onClose={() => setOpen(false)} />}
    </section>
  )
}
