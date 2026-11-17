import { useCallback, useEffect, useState } from 'react'
import { trackCtaClick, trackEvent } from '../../lib/analytics'
import { getOroTextLink, isMobileMessagingDevice } from '../../lib/textOro'
import MessagesIcon from '../MessagesIcon'
import TextOroModal from '../overlays/TextOroModal'
import CtaSparkles from './CtaSparkles'

export function HomeLogo({ src = '/oro-logo.webp' }) {
  return <img className="halo-logo" src={src} alt="oro" width="1672" height="941" decoding="async" />
}

export function HomeCta({ place, children, className = '', href: customHref, showIcon = true, onClick, variant = 'primary' }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [smsLink, setSmsLink] = useState(() => getOroTextLink(''))
  const closeModal = useCallback(() => setModalOpen(false), [])

  // The prerendered HTML has no user agent, so the Apple/Android body separator is fixed after hydration.
  useEffect(() => setSmsLink(getOroTextLink()), [])

  const handleClick = (event) => {
    const mobile = isMobileMessagingDevice()
    trackCtaClick('get_number_click', {
      location: place,
      destination: mobile ? 'sms' : 'qr_handoff',
      device_class: mobile ? 'mobile' : 'desktop',
    })
    if (mobile) {
      trackEvent('message_app_open', { location: place, method: 'cta' })
      return
    }
    // Desktops can't open the SMS link, so they get a QR that opens it on the person's phone.
    event.preventDefault()
    setModalOpen(true)
  }

  const content = (
    <>
      {showIcon && !['header', 'floating'].includes(place) && <MessagesIcon className="halo-cta-message" />}
      <span>{children}</span>
      {['hero', 'closer'].includes(place) && <CtaSparkles />}
    </>
  )
  const classes = `oro-button oro-button--${variant} ${variant === 'primary' ? 'halo-cta' : ''} halo-cta--${place} ${className}`

  if (customHref) {
    return <a href={customHref} className={classes} onClick={onClick}>{content}</a>
  }

  return (
    <>
      <a href={smsLink} className={classes} onClick={onClick || handleClick}>{content}</a>
      <TextOroModal open={modalOpen} onClose={closeModal} source={place} />
    </>
  )
}

export function HomeHeader({ showCta = true, sticky = true, ctaVariant = 'primary' }) {
  return (
    <header className={`halo-header${sticky ? '' : ' halo-header--static'}`}>
      <div className="halo-container halo-header-inner">
        <a className="halo-logo-link" href="/" aria-label="oro home"><HomeLogo src="/oro-logo/oro-logo-ink.webp" /></a>
        {showCta && <nav className="halo-nav" aria-label="oro">
          <HomeCta place="header" variant={ctaVariant}>join the waitlist</HomeCta>
        </nav>}
      </div>
    </header>
  )
}
