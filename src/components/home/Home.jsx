import { Fragment, useEffect, useRef, useState } from 'react'
import '../GoldBackground.css'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'
import ProductDemo from './ProductDemo'
import StyleAdviceDemo from './StyleAdviceDemo'
import HeadlineMascot from './HeadlineMascot'
import StickyFeatures from './StickyFeatures'
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
const HEADLINE = 'the ai fashion assistant'
const TYPE_STEP = 34

function TypedHeadline() {
  const [finished, setFinished] = useState(false)
  let index = 0
  return <>{HEADLINE.split(' ').map((word, wordIndex, words) => {
    const Word = 'span'
    return (
      <Fragment key={wordIndex}>
        <Word className="home-type-word">
          {[...word].map((char, charIndex) => (
            <span className="home-type-char" key={charIndex}
              onAnimationEnd={wordIndex === words.length - 1 && charIndex === word.length - 1 ? (event) => {
                if (event.animationName === 'homeTypeChar') setFinished(true)
              } : undefined}
              style={{ '--home-char-delay': `${80 + index++ * TYPE_STEP}ms` }}>{char}</span>
          ))}
        </Word>
        {wordIndex === 2 && <HeadlineMascot revealed={finished} />}
        {wordIndex === 3 ? <br /> : wordIndex < words.length - 1 ? ' ' : null}
      </Fragment>
    )
  })}<em className="home-rotating-line">
    {['you can text.', 'with your closet.', 'that knows your taste.'].map((phrase, index) => <span className="home-rotating-phrase" key={phrase} style={{ '--home-phrase-delay': `${index * 3}s` }}>{phrase}</span>)}
  </em></>
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
      <div className="home-grid halo-container">
        <div className="home-copy">
          <section className="home-panel" ref={heroRef} aria-labelledby="home-title" data-analytics-section="hero">
            <div className="home-hero-copy">
              <Heading as="h1" variant="display" id="home-title" aria-label={`${HEADLINE} you can text., with your closet., that knows your taste.`}>
                <span aria-hidden="true"><TypedHeadline /></span>
              </Heading>
              <Text muted className="home-description home-enter">
                not another digital closet, not another chatbot
              </Text>
              <div className="home-action">
                <HomeCta place="hero" className="home-enter" href="/merch" showIcon={false}>make your mark</HomeCta>
              </div>
            </div>
          </section>
          <ProductDemo />
          <section className="home-panel home-moments-panel" aria-labelledby="home-moments-title" data-home-reveal data-analytics-section="personalized_style">
            <Heading as="h2" variant="title" id="home-moments-title" className="home-stagger">she gets your style. and your life.</Heading>
            <Text muted className="home-description home-stagger" style={{ '--home-delay': '120ms' }}>
              oro learns what you wear and what you like, so her advice gets more personal the more you text.
            </Text>
          </section>
          <StickyFeatures features={FEATURES} />
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
