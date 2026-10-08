import { useEffect, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { trackCtaClick } from '../../lib/analytics'
import { getOroTextLink, ORO_TEXT_NUMBER_DISPLAY } from '../../lib/textOro'
import hello from '../../assets/mascot/oro_hi.webp'
import './TextOro.css'

export default function TextOro() {
  const [href, setHref] = useState(getOroTextLink(''))

  useEffect(() => {
    setHref(getOroTextLink())
  }, [])

  return (
    <section className="text-oro" aria-labelledby="text-oro-title">
      <div className="text-oro-inner">
        <div className="text-oro-copy">
          <span className="text-oro-eyebrow">meet your personal stylist</span>
          <Heading as="h1" variant="title" id="text-oro-title">one text away<br />from your next fit.</Heading>
          <Text className="text-oro-description">oro lives in your texts. send her a hello, then tell her what you’re getting dressed for.</Text>
          <a className="oro-button oro-button--primary text-oro-cta" href={href}
            onClick={() => trackCtaClick('text_oro_click', { location: 'get_started', destination: 'sms' })}>
            text oro <span aria-hidden="true">↗</span>
          </a>
          <div className="text-oro-number">
            <Text variant="support" muted>or text her at</Text>
            <a href={href}>{ORO_TEXT_NUMBER_DISPLAY}</a>
          </div>
        </div>
        <div className="text-oro-handoff">
          <img className="text-oro-mascot" src={hello} alt="oro waving hello" width="260" height="260" />
          <div className="text-oro-qr-card">
            <img src="/text-oro-qr.svg" alt="QR code to start a text with oro" width="156" height="156" />
            <div><h2>take oro with you.</h2><Text variant="support" muted>scan to text oro.</Text></div>
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
