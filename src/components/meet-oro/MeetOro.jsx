import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from '../home/HomeChrome'
import { trackCtaClick, trackEvent } from '../../lib/analytics'
import { MONTHLY_AMOUNT, formatPrice } from '../../lib/checkout'
import './MeetOro.css'

export default function MeetOro() {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [checkoutHref, setCheckoutHref] = useState('/checkout')

  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get('invite')
    if (!invite) return
    try {
      const url = new URL(invite)
      if (url.origin === window.location.origin && url.pathname === '/invite' && /^[0-9a-f]{64}$/.test(url.searchParams.get('ref') || '')) {
        setCheckoutHref(`/checkout?invite=${encodeURIComponent(url.href)}`)
      }
    } catch {}
  }, [])

  const play = async () => {
    try { await videoRef.current.play() } catch { setPlaying(false) }
  }

  return <div className="meet-oro halo-container">
    <div className="meet-oro-layout">
      <div className="meet-oro-copy">
        <Text variant="support" muted className="meet-oro-eyebrow">a little outfit help, right in your texts.</Text>
        <Heading as="h1" variant="display">your closet has <em>possibilities.</em></Heading>
        <Text muted className="meet-oro-description">tell oro where you’re going. she’ll put a look together from what you own, then work with you until it feels right.</Text>
      </div>
      <figure className="meet-oro-demo">
        <div className="meet-oro-video-wrap">
          <video ref={videoRef} src="/demos/oro-message-thread.mp4" poster="/demos/oro-message-thread-poster.webp"
            controls playsInline preload="metadata" aria-label="Oro product demo" aria-describedby="meet-oro-video-caption"
            onPlay={() => {
              setPlaying(true)
              trackEvent('video_play', { location: 'pre_checkout_demo', video_id: 'oro_message_thread' })
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false)
              trackEvent('video_complete', { location: 'pre_checkout_demo', video_id: 'oro_message_thread' })
            }}
            onError={() => { setFailed(true); setPlaying(false) }}>
            Your browser doesn’t support this video. Read the demo below, or continue to checkout.
          </video>
          {!playing && !failed && <button className="meet-oro-play" type="button" aria-label="play oro demo" onClick={play}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </button>}
        </div>
        <figcaption id="meet-oro-video-caption">{failed ? <span role="status">the demo couldn’t load. you can still continue below.</span> : '13 seconds. one conversation. a new way to wear what you own.'}</figcaption>
        <details className="meet-oro-transcript">
          <summary>read the demo</summary>
          <p><strong>you:</strong> i have class then dinner with someone tonight, no idea what to wear.</p>
          <p><strong>oro:</strong> cold and grey today, so we’re layering — jeans, the black cami, cardigan over. how’s this?</p>
          <p>oro shows an outfit with those pieces, shoes, a bag, and accessories.</p>
          <p><strong>you:</strong> obsessed. can we swap the jeans for a skirt though?</p>
          <p><strong>oro:</strong> easy — your cargo mini. i’m switching the sneakers for the suede boots, trust me.</p>
          <p>oro shows the updated outfit.</p>
        </details>
      </figure>
      <div className="meet-oro-action">
        <HomeCta place="hero" href={checkoutHref} showIcon={false}
          onClick={() => trackCtaClick('demo_checkout_click', { location: 'pre_checkout_demo', destination: 'web_checkout' })}>
          let oro help you get dressed
        </HomeCta>
        <p className="meet-oro-price">{formatPrice(MONTHLY_AMOUNT)} USD / month</p>
        <p className="meet-oro-payment-note">you’ll review your subscription before paying.</p>
      </div>
    </div>
  </div>
}
