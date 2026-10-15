import { useCallback, useEffect, useRef, useState } from 'react'
import { trackCtaClick, trackEvent } from '../../lib/analytics'
import './MeetOro.css'

export default function MeetOro() {
  const videoRef = useRef(null)
  const transitionTimer = useRef(null)
  const leaving = useRef(false)
  const [phase, setPhase] = useState('enter')
  const [status, setStatus] = useState('starting')
  const [checkoutHref, setCheckoutHref] = useState('/checkout')

  const play = useCallback(async () => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    try {
      await video.play()
      if (videoRef.current === video && !leaving.current) setStatus(video.ended ? 'ended' : 'playing')
    } catch {
      if (videoRef.current === video && !leaving.current) {
        if (video.error) setStatus('error')
        else if (video.paused) setStatus('paused')
      }
    }
  }, [])

  useEffect(() => {
    play()
    const restoreFromCache = event => {
      if (!event.persisted) return
      clearTimeout(transitionTimer.current)
      transitionTimer.current = null
      leaving.current = false
      setPhase('enter')
      if (videoRef.current?.ended) setStatus('ended')
      else play()
    }
    window.addEventListener('pageshow', restoreFromCache)
    return () => {
      clearTimeout(transitionTimer.current)
      window.removeEventListener('pageshow', restoreFromCache)
    }
  }, [play])

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

  const continueToCheckout = event => {
    trackCtaClick('demo_checkout_click', { location: 'pre_checkout_demo', destination: 'web_checkout' })
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    event.preventDefault()
    if (leaving.current) return
    leaving.current = true
    const href = event.currentTarget.href
    videoRef.current?.pause()
    setPhase('exit')
    transitionTimer.current = setTimeout(() => {
      transitionTimer.current = null
      window.location.assign(href)
    }, 160)
  }

  const replay = () => {
    videoRef.current.currentTime = 0
    setStatus('starting')
    play()
  }

  return <section className="meet-oro meet-oro--immersive" aria-label="Oro product demo">
    <div className="meet-oro-stage" data-phase={phase} data-state={status} aria-busy={phase === 'exit'} inert={phase === 'exit' ? '' : undefined}>
      <video ref={videoRef} src="/demos/oro-onboarding-demo.mp4" poster="/demos/oro-onboarding-demo-poster.jpg" width="600" height="1298"
        autoPlay muted controls playsInline preload="auto" aria-label="Oro product demo" aria-describedby="meet-oro-video-summary"
        onPlay={() => {
          setStatus('playing')
          trackEvent('video_play', { location: 'pre_checkout_demo', video_id: 'oro_onboarding_demo' })
        }}
        onPause={() => { if (!leaving.current && !videoRef.current?.ended && !videoRef.current?.error) setStatus('paused') }}
        onEnded={() => {
          setStatus('ended')
          trackEvent('video_complete', { location: 'pre_checkout_demo', video_id: 'oro_onboarding_demo' })
        }}
        onError={() => setStatus('error')}>
        Your browser doesn’t support this video.
      </video>
      <div className="meet-oro-accessible">
        <h1>See Oro in action</h1>
        <p id="meet-oro-video-summary">A text conversation shows Oro styling a casual date-night outfit from an existing closet, changing the jeans on request, and sending a virtual try-on image.</p>
      </div>
      {status !== 'ended' && status !== 'error' && <a className="meet-oro-skip" href={checkoutHref} aria-label="skip video and continue to checkout" onClick={continueToCheckout}>skip <span aria-hidden="true">→</span></a>}
      {status === 'paused' && <button className="meet-oro-play" type="button" aria-label="play oro demo" onClick={play}>
        <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
      </button>}
      {(status === 'ended' || status === 'error') && <div className="meet-oro-endcard">
        {status === 'error' && <p role="status">the video couldn’t load. you can still meet oro.</p>}
        <a className="oro-button meet-oro-button" href={checkoutHref} onClick={continueToCheckout}>let oro help you get dressed</a>
        {status === 'ended' && <button className="meet-oro-replay" type="button" onClick={replay}>watch again</button>}
      </div>}
    </div>
  </section>
}
