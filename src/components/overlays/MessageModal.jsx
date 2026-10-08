import { useId } from 'react'
import { Heading } from 'oro-kit'
import './MessageModal.css'

function PhoneIcon() {
  return (
    <svg className="home-message-phone-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M10.5 18.5h3" />
    </svg>
  )
}

export default function MessageModal({ dialogRef, onClose }) {
  const titleId = useId()
  const message = 'Hey oro! Your newest oronaut has landed 🚀\n\nI AGREE to receive recurring automated texts from oro for onboarding, styling advice, and follow-ups at this number. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.'
  const apple = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
  const smsHref = `sms:+18556762419${apple ? '&' : '?'}body=${encodeURIComponent(message)}`

  const handleDialogClick = (event) => {
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      event.currentTarget.close()
    }
  }

  return (
    <dialog className="home-message-dialog" ref={dialogRef} aria-labelledby={titleId} onClick={handleDialogClick} onClose={onClose}>
      <button type="button" className="home-message-close" aria-label="Close" onClick={() => dialogRef.current?.close()} autoFocus><span aria-hidden="true">×</span></button>
      <div className="home-message-dialog-copy">
        <Heading as="h2" variant="title" id={titleId}>get oro&apos;s<br />number</Heading>
        <p>scan the code or tap the number, then send the prefilled message to get started.</p>
        <a className="home-message-number" href={smsHref}>
          <PhoneIcon />
          <span><small>text</small><strong>+1 (855) 676-2419</strong></span>
        </a>
      </div>
      <div className="home-message-visual">
        <div className="home-message-qr">
          <img src="/oro-sms-consent-qr.png" alt="QR code that opens a text to oro with the greeting and messaging consent" width="512" height="512" />
        </div>
      </div>
      <div className="home-message-footer">
        <p>By continuing, you agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>
      </div>
    </dialog>
  )
}
