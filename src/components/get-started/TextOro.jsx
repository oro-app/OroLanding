import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { trackCtaClick } from '../../lib/analytics'
import hello from '../../assets/mascot/oro_hi.webp'
import './TextOro.css'

export const ORO_PHONE = '+18556762419'
export const FIRST_TEXT = "hey oro! help me figure out what to wear 💜"

export function textingLink(userAgent = '') {
  const separator = /iPhone|iPad|iPod|Macintosh/.test(userAgent) ? '&' : '?'
  return `sms:${ORO_PHONE}${separator}body=${encodeURIComponent(FIRST_TEXT)}`
}

export default function TextOro() {
  const title = useRef(null)
  const [href, setHref] = useState(textingLink())

  useEffect(() => {
    setHref(textingLink(navigator.userAgent))
    title.current?.focus()
  }, [])

  return (
    <section className="text-oro" aria-labelledby="text-oro-title">
      <div className="text-oro-inner">
        <div className="text-oro-copy">
          <span className="text-oro-eyebrow">meet your personal stylist</span>
          <Heading ref={title} as="h1" variant="title" id="text-oro-title" tabIndex={-1}>one text away<br />from your next fit.</Heading>
          <Text className="text-oro-description">oro lives in your texts. send her a hello, then tell her what you’re getting dressed for.</Text>
          <a className="oro-button oro-button--primary text-oro-cta" href={href}
            onClick={() => trackCtaClick('text_oro_click', { location: 'get_started', destination: 'sms' })}>
            text oro <span aria-hidden="true">↗</span>
          </a>
          <Text variant="support" muted className="text-oro-send-note">opens Messages with a hello ready to send.<br />tap send to start your conversation.</Text>
          <div className="text-oro-number">
            <Text variant="support" muted>or text her at</Text>
            <a href={`sms:${ORO_PHONE}`}>+1 (855) 676-2419</a>
          </div>
        </div>
        <div className="text-oro-handoff">
          <img className="text-oro-mascot" src={hello} alt="oro waving hello" width="260" height="260" />
          <div className="text-oro-qr-card">
            <img src="/text-oro-qr.svg" alt="QR code to open this page on your phone" width="156" height="156" />
            <div><h2>take oro with you.</h2><Text variant="support" muted>scan with your phone camera,<br />then tap “text oro”.</Text></div>
          </div>
        </div>
        <div className="text-oro-next">
          <span aria-hidden="true">✦</span>
          <Text variant="support">already signed up? use the same phone number.<br />new here? oro will help you get started in the conversation.</Text>
        </div>
        <Text variant="support" muted className="text-oro-fine-print">oro is for ages 16+ in the US and Canada, excluding Quebec. she’ll confirm the essentials before you begin. <a href="/terms">terms</a> · <a href="/privacy">privacy</a></Text>
      </div>
    </section>
  )
}
