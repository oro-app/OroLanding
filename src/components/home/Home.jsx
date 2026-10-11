import { Fragment, useEffect, useRef, useState } from 'react'
import GoldBackground from '../GoldBackground'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'
import ProductDemo from './ProductDemo'
import StyleAdviceDemo from './StyleAdviceDemo'
import SmsBubble from './SmsBubble'
import wardrobeDemo from '../../assets/demos/wardrobe.png'
import cargosLook from '../../assets/fit-gen-demo/mens-cargos.webp'
import jotting from '../../assets/mascot/jotting.webp'
import { hasAnalyticsConsent, trackEvent } from '../../lib/analytics'

const FEATURES = [
  {
    title: 'show her your closet',
    description: 'send oro photos of your clothes once. she’ll remember what you own and build outfits from your actual wardrobe.',
    image: wardrobeDemo,
    imageAlt: 'Three outfit photos with the clothing pieces shown below them.',
    width: 1312,
    height: 1199,
  },
  {
    title: 'don’t like it? tell her.',
    description: 'make it warmer. less basic. swap the jeans. start over. keep going until it actually feels like you.',
    image: cargosLook,
    imageAlt: 'Streetwear outfit with olive cargo pants, a brown leather jacket, a graphic tee, and silver sneakers.',
    width: 1086,
    height: 1448,
  },
  {
    title: 'the more you text her, the better she gets',
    description: 'she knows you don’t like jewelry, get cold easily, love those jeans, and have pilates on sunday mornings.',
    image: jotting,
    imageAlt: 'oro jotting notes in a notepad.',
    width: 1500,
    height: 1500,
  },
]
const HEADLINE = 'the ai fashion assistant you can text'
const TYPE_STEP = 34

function TypedHeadline() {
  let index = 0
  return HEADLINE.split(' ').map((word, wordIndex, words) => {
    const Word = wordIndex === words.length - 1 ? 'em' : 'span'
    return (
      <Fragment key={wordIndex}>
        <Word className="home-type-word">
          {[...word].map((char, charIndex) => (
            <span className="home-type-char" key={charIndex}
              style={{ '--home-char-delay': `${80 + index++ * TYPE_STEP}ms` }}>{char}</span>
          ))}
        </Word>
        {wordIndex === 3 ? <br /> : wordIndex < words.length - 1 ? ' ' : null}
      </Fragment>
    )
  })
}

function HeroChat() {
  const [messages, setMessages] = useState([
    { from: 'you', text: 'dinner tonight. cute, but not trying too hard?' },
    { from: 'oro', text: 'say less. what’s the weather doing?' },
  ])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const timerRef = useRef()
  const threadRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])
  useEffect(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }), [messages, typing])

  const sendMessage = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || typing) return
    setMessages((current) => [...current, { from: 'you', text }])
    setDraft('')
    setTyping(true)
    timerRef.current = setTimeout(() => {
      setMessages((current) => [...current, { from: 'oro', text: 'perfect. give me a sec — i’m building your look ✨' }])
      setTyping(false)
    }, 700)
  }

  return <div className="home-hero-chat" aria-label="Chat with oro">
    <div className="home-hero-chat-bar">
      <span aria-hidden="true">‹</span>
      <div><strong>oro</strong><small>Text Message</small></div>
      <span aria-hidden="true" />
    </div>
    <div className="home-hero-chat-thread" ref={threadRef} role="log" aria-live="polite" aria-relevant="additions">
      <p>Today 8:42 AM</p>
      {messages.map((message, index) => <div className={`home-hero-message home-hero-message--${message.from}`} key={`${message.from}-${index}`}>
        <SmsBubble tone={message.from === 'you' ? 'dark-purple' : 'cream'} side={message.from === 'you' ? 'right' : 'left'}>
          <span className="sr-only">{message.from}: </span>{message.text}
        </SmsBubble>
      </div>)}
      {typing && <div className="home-hero-typing" aria-label="oro is typing"><i /><i /><i /></div>}
    </div>
    <form className="home-hero-compose" onSubmit={sendMessage}>
      <label className="sr-only" htmlFor="home-hero-message">Message oro</label>
      <input id="home-hero-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="iMessage" autoComplete="off" />
      <button type="submit" aria-label="Send message" disabled={typing}><span aria-hidden="true">↑</span></button>
    </form>
  </div>
}

export default function Home() {
  const motionRef = useHomeMotion()
  const heroRef = useRef(null)
  const viewedSectionsRef = useRef(new Set())
  const [entryCount, setEntryCount] = useState(null)
  const [showFloatingCta, setShowFloatingCta] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    const footer = document.querySelector('.halo-footer--landing')
    if (!hero || !footer) return

    let heroPassed = false
    let footerVisible = false
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === hero) heroPassed = !entry.isIntersecting && entry.boundingClientRect.bottom <= 0
        if (entry.target === footer) footerVisible = entry.isIntersecting
      })
      setShowFloatingCta(heroPassed && !footerVisible)
    })
    observer.observe(hero)
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let observer
    const observeSections = () => {
      if (!hasAnalyticsConsent() || !('IntersectionObserver' in window)) return

      observer?.disconnect()
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || viewedSectionsRef.current.has(entry.target)) return
          viewedSectionsRef.current.add(entry.target)
          observer.unobserve(entry.target)
          trackEvent('section_view', { section_name: entry.target.dataset.analyticsSection })
        })
      }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' })

      document.querySelectorAll('[data-analytics-section]').forEach((section) => {
        if (!viewedSectionsRef.current.has(section)) observer.observe(section)
      })
    }

    observeSections()
    window.addEventListener('oro:analytics-consent-change', observeSections)
    return () => {
      observer?.disconnect()
      window.removeEventListener('oro:analytics-consent-change', observeSections)
    }
  }, [entryCount])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/beta-count', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (Number.isSafeInteger(result?.count) && result.count > 100) setEntryCount(result.count)
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  return (
    <div className="halo-home" ref={motionRef}>
      <GoldBackground />
      <div className="home-grid halo-container">
        <div className="home-copy">
          <section className="home-panel" ref={heroRef} aria-labelledby="home-title" data-analytics-section="hero">
            <div className="home-hero-copy">
              <Heading as="h1" variant="display" id="home-title" aria-label={HEADLINE}>
                <span aria-hidden="true"><TypedHeadline /></span>
              </Heading>
              <Text muted className="home-description home-enter">
                personalized outfit advice for your closet, your style, and your plans.
              </Text>
              <div className="home-action">
                <HomeCta place="hero" className="home-enter">get her number</HomeCta>
              </div>
            </div>
            <HeroChat />
          </section>
          <ProductDemo />
          <section className="home-panel home-moments-panel" aria-labelledby="home-moments-title" data-home-reveal data-analytics-section="personalized_style">
            <Heading as="h2" variant="title" id="home-moments-title" className="home-stagger">she gets your style. and your life.</Heading>
            <Text muted className="home-description home-stagger" style={{ '--home-delay': '120ms' }}>
              oro learns what you wear and what you like, so her advice gets more personal the more you text.
            </Text>
          </section>
          <section className="home-features" aria-label="oro features">
            {FEATURES.map((feature, index) => (
              <article className={`home-feature${index % 2 === 0 ? ' home-feature--media-left' : ''}`} key={feature.title} data-home-reveal data-analytics-section={index === 0 ? 'closet' : index === 1 ? 'outfit_iteration_demo' : 'learns_preferences'}>
                <div className="home-feature-copy home-stagger">
                  <Heading as="h2" variant="title">{index === 2 ? <>the more you text her,<br />the better she gets</> : feature.title}</Heading>
                  <Text muted className="home-description">{feature.description}</Text>
                </div>
                <img className="home-feature-media home-stagger" src={feature.image} alt={feature.imageAlt} loading="lazy" decoding="async" width={feature.width} height={feature.height} />
              </article>
            ))}
          </section>
          <StyleAdviceDemo />
          {entryCount !== null && <section className="home-social-proof home-moments-panel" aria-labelledby="home-social-title" data-home-reveal data-analytics-section="social_proof">
            <Heading as="h2" variant="title" id="home-social-title" className="home-stagger">everyone wants her number.</Heading>
            <Text muted className="home-description home-stagger">{entryCount.toLocaleString()} people are already trying to get it.</Text>
          </section>}
        </div>
      </div>
      <div className={`home-floating-cta${showFloatingCta ? ' home-floating-cta--visible' : ''}`} inert={showFloatingCta ? undefined : ''}>
        <HomeCta place="floating">get her number</HomeCta>
      </div>
    </div>
  )
}
