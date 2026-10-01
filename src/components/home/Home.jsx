import { Fragment, useEffect, useState } from 'react'
import GoldBackground from '../GoldBackground'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'
import ProductDemo from './ProductDemo'
import StyleAdviceDemo from './StyleAdviceDemo'
import wardrobeDemo from '../../assets/demos/wardrobe.png'
import iterateDemo from '../../assets/demos/iterate.png'
import oroTexting from '../../assets/mascot/oro_texting.png'

const FEATURES = [
  {
    title: 'show her your closet',
    description: 'send Oro photos of your clothes once. she’ll remember what you own and build outfits from your actual wardrobe.',
    image: wardrobeDemo,
    imageAlt: 'Three outfit photos with the clothing pieces shown below them.',
    width: 1312,
    height: 1199,
  },
  {
    title: 'don’t like it? tell her.',
    description: 'make it warmer. less basic. swap the jeans. start over. keep going until it actually feels like you.',
    image: iterateDemo,
    imageAlt: 'Outfit suggestions in a text conversation, including a request to swap jeans for a skirt.',
    width: 1078,
    height: 1459,
  },
  {
    title: 'the more you text her, the better she gets',
    description: 'she remembers that you hate jewelry, get cold easily, always reach for those jeans, and have pilates Sunday morning.',
    image: oroTexting,
    imageAlt: 'oro looking at a phone with a clothing idea in a speech bubble.',
    width: 1500,
    height: 1500,
  },
]
const HEADLINE = 'The AI fashion assistant you can text'
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
              give us your number. we’ll give you hers.<br />
              your personal fashion stylist over text, for outfits, second opinions, and figuring out what to wear.
            </Text>
            <div className="home-action">
              <HomeCta place="hero" className="home-enter">get her number</HomeCta>
              {entryCount !== null && <Text variant="support" muted className="home-beta-note home-enter">{entryCount.toLocaleString()} people are trying to get Oro’s number</Text>}
            </div>
          </section>
          <ProductDemo />
          <section className="home-panel home-moments-panel" aria-labelledby="home-moments-title" data-home-reveal>
            <Heading as="h2" variant="title" id="home-moments-title" className="home-stagger">she gets your style. and your life.</Heading>
            <Text muted className="home-description home-stagger" style={{ '--home-delay': '120ms' }}>
              Oro learns what you wear, what you like, and what you have going on, so her advice gets more personal the more you text.
            </Text>
          </section>
          <section className="home-features" aria-label="Oro features">
            {FEATURES.map((feature, index) => (
              <article className={`home-feature${index % 2 === 0 ? ' home-feature--media-left' : ''}`} key={feature.title} data-home-reveal>
                <div className="home-feature-copy home-stagger">
                  <Heading as="h2" variant="title">{feature.title}</Heading>
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
