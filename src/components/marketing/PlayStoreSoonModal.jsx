import { DISCORD_URL } from '../../lib/links'
import './PlayStoreSoonModal.css'

// "android, almost ready." — fires when someone taps the Google Play button.
// Google Play goes live May 2026 (this week as of writing). Until then this
// modal acks the click and gives two ways to be notified: mailing list
// (handled at the page level so the existing WaitlistModal can open) and
// Discord (direct link).
export default function PlayStoreSoonModal({ onClose, onMailingList }) {
  const handleMailingList = () => {
    onClose?.()
    onMailingList?.()
  }

  return (
    <div className="psm-backdrop" onClick={onClose}>
      <div className="psm-card" onClick={(e) => e.stopPropagation()}>
        <button className="psm-close" onClick={onClose} aria-label="Close">✕</button>

        <p className="psm-eyebrow">google play</p>
        <h3 className="psm-title">android, almost ready.</h3>
        <p className="psm-sub">
          We&apos;re days from shipping to the Google Play Store. Want to know the
          minute we do? Join the mailing list or hop into the Discord.
        </p>

        <div className="psm-actions">
          <button type="button" className="psm-btn psm-btn--filled" onClick={handleMailingList}>
            Join the mailing list
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </button>
          <a
            className="psm-btn psm-btn--outlined"
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
          >
            Join the Discord
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
