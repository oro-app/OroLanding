import { Heading, Text } from 'oro-kit'
import ButtonArrow from '../ButtonArrow'
import { useId, useRef } from 'react'
import useScrolled from '../../hooks/useScrolled'
import { trackCtaClick } from '../../lib/analytics'
import { FOOTER_LINKS } from '../../lib/siteLinks'

function HomeLogo() {
  return <img className="halo-logo" src="/oro-logo.webp" alt="oro" width="1672" height="941" decoding="async" />
}

function PhoneIcon() {
  return (
    <svg className="home-message-phone-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M10.5 18.5h3" />
    </svg>
  )
}

export function HomeCta({ place, children, className = '' }) {
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const titleId = useId()
  const isHero = place === 'hero'
  const message = 'Hey oro! Your newest oronaut has landed 🚀\n\nI AGREE to receive recurring automated texts from oro for onboarding, styling advice, and follow-ups at this number. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help. Consent is not a condition of purchase.'
  const apple = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)
  const smsHref = `sms:+18556762419${apple ? '&' : '?'}body=${encodeURIComponent(message)}`

  const handleClick = () => {
    trackCtaClick('get_started_click', { location: place, destination: 'messages_modal' })
    dialogRef.current?.showModal()
  }

  const handleDialogClick = (event) => {
    const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
    if (event.clientX < left || event.clientX > right || event.clientY < top || event.clientY > bottom) {
      event.currentTarget.close()
    }
  }

  return (
    <>
      <button type="button" ref={triggerRef} aria-haspopup="dialog" className={`oro-button oro-button--primary halo-cta halo-cta--${place} ${className}`}
        onClick={handleClick}>
        {children}
        {isHero && <ButtonArrow className="halo-cta-arrow" />}
      </button>
      <dialog className="home-message-dialog" ref={dialogRef} aria-labelledby={titleId} onClick={handleDialogClick} onClose={() => triggerRef.current?.focus()}>
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
    </>
  )
}

export function HomeHeader() {
  const scrolled = useScrolled()

  return (
    <header className={`halo-header${scrolled ? ' halo-header--scrolled' : ''}`}>
      <div className="halo-container halo-header-inner">
        <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
        <nav className="halo-nav" aria-label="oro">
          <HomeCta place="header">want her number?</HomeCta>
        </nav>
      </div>
    </header>
  )
}

export function HomeFooter({ landing = false, closerTitle = 'want her number?', closerText = "give us yours and you'll have hers", closerAction }) {
  if (!landing) {
    return (
      <footer className="halo-footer halo-container">
        <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo /></a>
        <nav className="halo-footer-links" aria-label="Site footer">
          {FOOTER_LINKS.map((link) => <a key={link.href} href={link.href}>{link.label[0].toUpperCase() + link.label.slice(1)}</a>)}
        </nav>
        <Text variant="support" muted>© 2026 Oro Digital Inc.</Text>
      </footer>
    )
  }

  return (
    <footer className="halo-footer halo-footer--landing">
      <div className="halo-container">
        <section className="halo-footer-closer" aria-labelledby="closer-title" data-analytics-section="final_cta">
          <Heading as="h2" variant="title" id="closer-title">{closerTitle}</Heading>
          {closerText && <Text muted>{closerText}</Text>}
          {closerAction || <HomeCta place="closer">get her number</HomeCta>}
        </section>
        <div className="halo-footer-main">
          <div className="halo-footer-brand">
            <a className="halo-logo-link" href="/" aria-label="oro home">
              <img className="halo-footer-wordmark" src="/oro_logo_wordmark_cream.webp" alt="" width="1445" height="675" decoding="async" />
            </a>
            <nav className="halo-footer-social" aria-label="Social and editorial">
              <a href="https://www.instagram.com/askoro.now" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.linkedin.com/company/askoro" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.4 9h3.6v12H3.4V9Zm5.7 0h3.5v1.6h.1a3.9 3.9 0 0 1 3.5-1.9c3.8 0 4.5 2.5 4.5 5.7V21h-3.6v-5.8c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3V21H9.1V9Z" /></svg>
              </a>
              <a href="https://x.com/askoro_now" aria-label="X" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-7.5L5.5 22H2.4l7.3-8.4L2 2h6.2l4.3 6.8L18.9 2Zm-1.1 18h1.7L7.2 3.9H5.4L17.8 20Z" /></svg>
              </a>
              <a href="/from-the-closet" aria-label="From the closet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 6a2 2 0 1 1 2.7 1.9c-.5.2-.7.5-.7 1.1v1l9 6a1.6 1.6 0 0 1-.9 2.9H3.9A1.6 1.6 0 0 1 3 16l9-6" /></svg>
              </a>
            </nav>
          </div>
          <nav className="halo-footer-legal" aria-label="Company and legal">
            <h3>Explore</h3>
            <a href="/about">About the team</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/cookies">Cookies</a>
          </nav>
        </div>
        <div className="halo-footer-bottom">
          <span>© 2026 Oro Digital Inc. · Made w luv &lt;3</span>
        </div>
      </div>
    </footer>
  )
}
