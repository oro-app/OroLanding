import { useEffect, useRef, useState } from 'react'
import '../GoldBackground.css'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'
import DesignerChat from './DesignerChat'
import DesignerFeatures, { DesignerRibbon } from './DesignerFeatures'
import DesignerHeadline from './DesignerHeadline'
import GoldBackground from '../GoldBackground'
import wardrobeDemo from '../../assets/demos/camera-roll-closet.webp'
import cargosLook from '../../assets/fit-gen-demo/mens-cargos.webp'
import jotting from '../../assets/mascot/jotting.webp'
import { hasAnalyticsConsent, trackEvent } from '../../lib/analytics'

const FEATURES = [
  {
    title: 'show her your closet',
    description: 'your camera roll is already a closet. connect it, and oro builds your closet for you.',
    image: wardrobeDemo,
    imageAlt: 'Casual camera-roll photos of clothes in a closet, clothes spread on a bed, a mirror selfie, and a top-down outfit selfie.',
    width: 1254,
    height: 1254,
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
    description: 'she knows you don’t like jewelry, get cold easily, and have pilates on sunday mornings.',
    image: jotting,
    imageAlt: 'oro jotting notes in a notepad.',
    width: 1500,
    height: 1500,
  },
]
export default function Home() {
  const motionRef = useHomeMotion()
  const heroRef = useRef(null)
  const viewedSectionsRef = useRef(new Set())
  const [entryCount, setEntryCount] = useState(null)
  const [showFloatingCta, setShowFloatingCta] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    const footer = document.querySelector('.halo-footer--landing')
    if (!hero || !footer || !('IntersectionObserver' in window)) return

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
      <div className="home-copy">
        <div className="home-grid halo-container">
          <section className="home-panel" ref={heroRef} aria-labelledby="home-title" data-analytics-section="hero">
            <div className="home-hero-copy">
              <Heading as="h1" variant="display" id="home-title" aria-label="the ai fashion assistant you can text">
                <DesignerHeadline />
              </Heading>
              <Text muted className="home-description home-enter">
                personalized outfit advice for your closet, your style, and your plans.
              </Text>
              <div className="home-action">
                <HomeCta place="hero" className="home-enter">find your next outfit</HomeCta>
              </div>
            </div>
          </section>
          <DesignerChat />
          <DesignerRibbon />
        </div>
        <DesignerFeatures features={FEATURES} />
        {entryCount !== null && <section className="home-social-proof home-moments-panel halo-container" aria-labelledby="home-social-title" data-home-reveal data-analytics-section="social_proof">
          <Heading as="h2" variant="title" id="home-social-title" className="home-stagger">everyone wants her number.</Heading>
          <Text muted className="home-description home-stagger">{entryCount.toLocaleString()} people are already trying to get it.</Text>
        </section>}
      </div>
      <div className={`home-floating-cta${showFloatingCta ? ' home-floating-cta--visible' : ''}`} inert={showFloatingCta ? undefined : ''}>
        <HomeCta place="floating">find your next outfit</HomeCta>
      </div>
    </div>
  )
}
