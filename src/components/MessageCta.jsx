import { useRef } from 'react'
import ButtonArrow from './ButtonArrow'
import MessageModal from './overlays/MessageModal'
import { trackCtaClick } from '../lib/analytics'

export default function MessageCta({ place, children, className = '' }) {
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)
  const isHero = place === 'hero'
  const handleClick = () => {
    trackCtaClick('get_started_click', { location: place, destination: 'messages_modal' })
    dialogRef.current?.showModal()
  }

  return (
    <>
      <button type="button" ref={triggerRef} aria-haspopup="dialog" className={`oro-button oro-button--primary halo-cta halo-cta--${place} ${className}`}
        onClick={handleClick}>
        {children}
        {isHero && <ButtonArrow className="halo-cta-arrow" />}
      </button>
      <MessageModal dialogRef={dialogRef} onClose={() => triggerRef.current?.focus()} />
    </>
  )
}
