import { Fragment, useEffect, useState } from 'react'
import GoldBackground from '../GoldBackground'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'
import ProductDemo from './ProductDemo'
import StyleAdviceDemo from './StyleAdviceDemo'
import wardrobeDemo from '../../assets/demos/wardrobe.png'
import IterationDemo from './IterationDemo'
import jotting from '../../assets/mascot/jotting.webp'

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
    demo: true,
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

export default function Home() {
  const motionRef = useHomeMotion()
  const [entryCount, setEntryCount] = useState(null)

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
          <section className="home-panel" aria-labelledby="home-title">
            <Heading as="h1" variant="display" id="home-title" aria-label={HEADLINE}>
              <span aria-hidden="true"><TypedHeadline /></span>
            </Heading>
            <Text muted className="home-description home-enter">
              personalized outfit advice for your closet, your style, and your plans.
            </Text>
            <div className="home-action">
              <HomeCta place="hero" className="home-enter">get her number</HomeCta>
              <Text variant="support" muted className="home-cta-note home-enter">text oro — no app needed</Text>
              {entryCount !== null && <Text variant="support" muted className="home-beta-note home-enter">{entryCount.toLocaleString()} people are trying to get oro’s number</Text>}
            </div>
          </section>
          <ProductDemo />
          <section className="home-panel home-moments-panel" aria-labelledby="home-moments-title" data-home-reveal>
            <Heading as="h2" variant="title" id="home-moments-title" className="home-stagger">she gets your style. and your life.</Heading>
            <Text muted className="home-description home-stagger" style={{ '--home-delay': '120ms' }}>
              oro learns what you wear and what you like, so her advice gets more personal the more you text.
            </Text>
          </section>
          <section className="home-features" aria-label="oro features">
            {FEATURES.map((feature, index) => feature.demo ? (
              <IterationDemo key={feature.title} title={feature.title} description={feature.description} />
            ) : (
              <article className={`home-feature${index % 2 === 0 ? ' home-feature--media-left' : ''}`} key={feature.title} data-home-reveal>
                <div className="home-feature-copy home-stagger">
                  <Heading as="h2" variant="title">{index === 2 ? <>the more you text her,<br />the better she gets</> : feature.title}</Heading>
                  <Text muted className="home-description">{feature.description}</Text>
                </div>
                <img className="home-feature-media home-stagger" src={feature.image} alt={feature.imageAlt} loading="lazy" decoding="async" width={feature.width} height={feature.height} />
              </article>
            ))}
          </section>
          <StyleAdviceDemo />
          {entryCount !== null && <section className="home-social-proof home-moments-panel" aria-labelledby="home-social-title" data-home-reveal>
            <Heading as="h2" variant="title" id="home-social-title" className="home-stagger">everyone wants her number.</Heading>
            <Text muted className="home-description home-stagger">{entryCount.toLocaleString()} people are already trying to get it.</Text>
          </section>}
        </div>
      </div>
    </div>
  )
}
