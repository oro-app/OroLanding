import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from '../home/HomeChrome'
import { trackCtaClick, trackEvent } from '../../lib/analytics'
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
          <video ref={videoRef} src="/demos/oro-onboarding-demo.mp4" poster="/demos/oro-onboarding-demo-poster.jpg"
            controls playsInline preload="metadata" aria-label="Oro product demo" aria-describedby="meet-oro-video-caption"
            onPlay={() => {
              setPlaying(true)
              trackEvent('video_play', { location: 'pre_checkout_demo', video_id: 'oro_onboarding_demo' })
            }}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false)
              trackEvent('video_complete', { location: 'pre_checkout_demo', video_id: 'oro_onboarding_demo' })
            }}
            onError={() => { setFailed(true); setPlaying(false) }}>
            Your browser doesn’t support this video. Read the demo below, or continue to checkout.
          </video>
          {!playing && !failed && <button className="meet-oro-play" type="button" aria-label="play oro demo" onClick={play}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
          </button>}
        </div>
        <figcaption id="meet-oro-video-caption">{failed ? <span role="status">the demo couldn’t load. you can still continue below.</span> : 'a date-night outfit, a quick adjustment, and a try-on. all by text.'}</figcaption>
        <details className="meet-oro-transcript">
          <summary>read the demo</summary>
          <p><strong>you:</strong> hey oro! i’ve got a date tonight.</p>
          <p>oro asks whether the vibe is casual, dinner, or something dressier.</p>
          <p><strong>you:</strong> more casual.</p>
          <p>oro sends an outfit from your closet, with a white tank, black bolero, jeans, brown sneakers, a necklace, and a crossbody bag.</p>
          <p><strong>you:</strong> can we change the pants?</p>
          <p>oro swaps the cargo jeans for medium-wash wide-leg jeans and explains how the pieces work together.</p>
          <p><strong>you:</strong> show me how it looks on me!</p>
          <p>oro sends a try-on image showing you wearing the outfit.</p>
          <p><strong>you:</strong> you’re a lifesaver.</p>
        </details>
      </figure>
      <div className="meet-oro-action">
        <HomeCta place="hero" href={checkoutHref} showIcon={false}
          onClick={() => trackCtaClick('demo_checkout_click', { location: 'pre_checkout_demo', destination: 'web_checkout' })}>
          let oro help you get dressed
        </HomeCta>
      </div>
    </div>
  </div>
}
