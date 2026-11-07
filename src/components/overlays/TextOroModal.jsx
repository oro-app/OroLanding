import QRCode from 'qrcode'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import oroTexting from '../../assets/mascot/oro_texting.webp'
import { trackEvent } from '../../lib/analytics'
import { getOroTextLink, ORO_TEXT_NUMBER_DISPLAY } from '../../lib/textOro'
import MessagesIcon from '../MessagesIcon'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function TextOroModal({ open, onClose, source, inviteUrl = '' }) {
  const titleId = useId()
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const [qrCode, setQrCode] = useState('')
  const smsLink = getOroTextLink(undefined, inviteUrl)

  useEffect(() => {
    if (!open) return undefined
    let active = true
    QRCode.toDataURL(smsLink, {
      color: { dark: '#0B0B0B', light: '#FFFDF8' },
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 360,
    }).then((url) => {
      if (active) setQrCode(url)
    }).catch(() => {})
    trackEvent('text_handoff_open', { location: source, method: 'qr_modal' })
    return () => { active = false }
  }, [open, smsLink, source])

  useEffect(() => {
    if (!open) return undefined
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        trackEvent('text_handoff_close', { location: source, method: 'escape' })
        onClose('escape')
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...dialogRef.current.querySelectorAll(FOCUSABLE)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const close = (method) => {
    trackEvent('text_handoff_close', { location: source, method })
    onClose(method)
  }

  return createPortal(
    <div className="text-oro-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close('backdrop')
    }}>
      <section className="text-oro-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}
        ref={dialogRef}>
        <button className="text-oro-close" type="button" onClick={() => close('button')} ref={closeRef}
          aria-label="Close get oro's number">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
        </button>
        <div className="text-oro-copy">
          <h2 id={titleId}>get oro's number</h2>
          <a className="text-oro-number" href={smsLink}
            onClick={() => trackEvent('message_app_open', { location: source, method: 'phone_number' })}>
            <MessagesIcon />
            <span><small>or text</small><span className="text-oro-number-value">{ORO_TEXT_NUMBER_DISPLAY}</span></span>
          </a>
          <p className="text-oro-terms">By continuing, you agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</p>
        </div>
        <div className="text-oro-visual">
          <div className="text-oro-bubble">hey, i'm oro ✨</div>
          <img className="text-oro-mascot" src={oroTexting} alt="" width="1500" height="1500" />
          <div className="text-oro-qr-frame">
            {qrCode
              ? <img src={qrCode} alt="QR code to start a text with oro" width="360" height="360" />
              : <span className="text-oro-qr-loading" aria-label="Preparing QR code" />}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  )
}
