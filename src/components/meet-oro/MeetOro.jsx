import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from '../home/HomeChrome'
import CtaSparkles from '../home/CtaSparkles'
import { trackCtaClick, trackEvent } from '../../lib/analytics'
import './MeetOro.css'

const ANSWERS = [
  { id: 'combinations', label: 'i don’t know what goes together' },
  { id: 'repetition', label: 'i keep wearing the same few things' },
  { id: 'forgotten_clothes', label: 'i forget about clothes i own' },
  { id: 'style', label: 'i bounce between styles and feel lost' },
  { id: 'confidence', label: 'i second-guess outfits before leaving' },
  { id: 'time', label: 'getting ready takes too long' },
  { id: 'experiment', label: 'i want to experiment without buying more' },
]
const ANSWERS_KEY = 'oro_dressing_answers'

export default function MeetOro() {
  const videoRef = useRef(null)
  const stageRef = useRef(null)
  const stepRef = useRef('question')
  const transitionTimer = useRef(null)
  const focusHeading = useRef(false)
  const [step, setStep] = useState('question')
  const [phase, setPhase] = useState('enter')
  const [selected, setSelected] = useState([])
  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)
  const [checkoutHref, setCheckoutHref] = useState('/checkout')

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(ANSWERS_KEY) || '[]')
      if (Array.isArray(saved)) setSelected(ANSWERS.filter(answer => saved.includes(answer.id)).map(answer => answer.id))
    } catch {}

    const restoreStep = () => {
      clearTimeout(transitionTimer.current)
      transitionTimer.current = null
      const next = window.location.hash === '#demo' ? 'demo' : 'question'
      setPhase('enter')
      if (next === stepRef.current) return
      videoRef.current?.pause()
      focusHeading.current = true
      stepRef.current = next
      setPlaying(false)
      setFailed(false)
      setStep(next)
    }
    const restoreFromCache = event => {
      if (event.persisted) restoreStep()
    }
    restoreStep()
    window.addEventListener('popstate', restoreStep)
    window.addEventListener('hashchange', restoreStep)
    window.addEventListener('pageshow', restoreFromCache)
    return () => {
      clearTimeout(transitionTimer.current)
      window.removeEventListener('popstate', restoreStep)
      window.removeEventListener('hashchange', restoreStep)
      window.removeEventListener('pageshow', restoreFromCache)
    }
  }, [])

  useEffect(() => {
    if (!focusHeading.current) return
    const frame = requestAnimationFrame(() => {
      stageRef.current?.querySelector('h1')?.focus({ preventScroll: true })
      window.scrollTo({ top: 0, behavior: 'instant' })
      focusHeading.current = false
    })
    return () => cancelAnimationFrame(frame)
  }, [step])

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

  const toggleAnswer = id => {
    const next = selected.includes(id) ? selected.filter(answer => answer !== id) : [...selected, id]
    setSelected(next)
    try { sessionStorage.setItem(ANSWERS_KEY, JSON.stringify(next)) } catch {}
  }

  const afterExit = action => {
    if (transitionTimer.current !== null) return
    videoRef.current?.pause()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      action()
      return
    }
    setPhase('exit')
    transitionTimer.current = setTimeout(() => {
      transitionTimer.current = null
      action()
    }, 180)
  }

  const changeStep = next => afterExit(() => {
    const url = new URL(window.location.href)
    url.hash = next === 'demo' ? 'demo' : ''
    if (next === 'question' && window.history.state?.oroFromQuestion) {
      window.history.back()
    } else if (next === 'demo') {
      window.history.pushState({ ...window.history.state, oroFromQuestion: true }, '', url)
    } else {
      window.history.replaceState(window.history.state, '', url)
    }
    focusHeading.current = true
    stepRef.current = next
    setPlaying(false)
    setFailed(false)
    setStep(next)
    setPhase('enter')
  })

  const continueToCheckout = event => {
    trackCtaClick('demo_checkout_click', { location: 'pre_checkout_demo', destination: 'web_checkout' })
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const href = event.currentTarget.href
    event.preventDefault()
    afterExit(() => window.location.assign(href))
  }

  return <div className="meet-oro halo-container">
    <ol className="meet-oro-progress" aria-label="your path to oro">
      {['you', 'meet oro', 'get started'].map((label, index) => <li key={label} aria-current={index === (step === 'question' ? 0 : 1) ? 'step' : undefined}
        className={index < (step === 'question' ? 0 : 1) ? 'is-complete' : ''}>
        <span className="meet-oro-step-number" aria-hidden="true">{index === 0 && step === 'demo' ? '✓' : index + 1}</span>
        <span>{label}</span>
      </li>)}
    </ol>
    <div ref={stageRef} key={step} className="meet-oro-stage" data-step={step} data-phase={phase} aria-busy={phase === 'exit'} inert={phase === 'exit' ? '' : undefined}>
    {step === 'question' ? <form className="meet-oro-question" onSubmit={event => {
      event.preventDefault()
      trackCtaClick('dressing_question_continue', { location: 'pre_checkout_question', selection_count: selected.length })
      changeStep('demo')
    }}>
      <div className="meet-oro-greeting" aria-hidden="true"><img src="/favicon.webp" alt="" width="44" height="44" /><span>a little about you</span><span className="meet-oro-twinkle">✦</span></div>
      <Heading as="h1" variant="display" id="meet-oro-question-title" tabIndex={-1}>what’s the hardest part of <em>getting dressed?</em></Heading>
      <Text muted id="meet-oro-question-help">pick all that sound like you.</Text>
      <fieldset className="meet-oro-checklist" aria-labelledby="meet-oro-question-title" aria-describedby="meet-oro-question-help" disabled={phase === 'exit'}>
        {ANSWERS.map((answer, index) => <label key={answer.id} className={`meet-oro-choice${selected.includes(answer.id) ? ' is-selected' : ''}`} style={{ '--choice-index': index }}>
          <span className="meet-oro-checkbox">
            <input type="checkbox" name="dressing" value={answer.id} checked={selected.includes(answer.id)} onChange={() => toggleAnswer(answer.id)} />
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
          </span>
          <span>{answer.label}</span>
        </label>)}
      </fieldset>
      <button className="oro-button oro-button--primary halo-cta halo-cta--hero meet-oro-continue" type="submit" disabled={phase === 'exit'}>
        <span>see oro in action</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-5-5 5 5-5 5" /></svg><CtaSparkles />
      </button>
    </form> : <>
    <button type="button" className="meet-oro-back" onClick={() => changeStep('question')} disabled={phase === 'exit'}><span aria-hidden="true">←</span> back</button>
    <div className="meet-oro-layout">
      <div className="meet-oro-copy">
        <Text variant="support" muted className="meet-oro-eyebrow">a little outfit help, right in your texts.</Text>
        <Heading as="h1" variant="display" tabIndex={-1}>your closet has <em>possibilities.</em></Heading>
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
          onClick={continueToCheckout}>
          let oro help you get dressed
        </HomeCta>
      </div>
    </div>
    </>}
    </div>
  </div>
}
