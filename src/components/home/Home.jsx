import { Fragment } from 'react'
import GoldBackground from '../GoldBackground'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'
import ProductDemo from './ProductDemo'
import StyleAdviceDemo from './StyleAdviceDemo'
import wardrobeDay from '../../assets/why-oro/wardrobe-day.webp'
import wardrobeNight from '../../assets/why-oro/wardrobe-night.webp'

const FEATURES = [
  {
    title: 'Digital wardrobe',
    description: 'Add the pieces you own so oro can put together outfits from your actual closet.',
    image: wardrobeDay,
  },
  {
    title: 'Iterate on an outfit with oro',
    description: 'Ask for a change, swap a piece, or try another direction. Keep refining until it feels right.',
    image: wardrobeNight,
  },
  {
    title: 'Memory about you',
    description: 'oro remembers the pieces you wear and the preferences you share, so suggestions feel more like you over time.',
    image: wardrobeDay,
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
              Getting dressed starts with a conversation. Text oro, your personal style assistant,
              for an outfit that feels like you.
            </Text>
            <div className="home-action">
              <HomeCta place="hero" className="home-enter">Join the beta</HomeCta>
            </div>
          </section>
          <ProductDemo />
          <section className="home-panel home-moments-panel" aria-labelledby="home-moments-title" data-home-reveal>
            <Heading as="h2" variant="title" id="home-moments-title" className="home-stagger">Look like yourself.<br />{' '}Feel ready for anything.</Heading>
            <Text muted className="home-description home-stagger" style={{ '--home-delay': '120ms' }}>
              From everyday plans to big moments, oro helps you find a look you’ll feel good in.
            </Text>
          </section>
          <section className="home-features" aria-labelledby="home-reasons-title">
            <div data-home-reveal>
              <Heading as="h2" variant="title" id="home-reasons-title" className="home-stagger">Why it works</Heading>
            </div>
            {FEATURES.map((feature, index) => (
              <article className={`home-feature${index % 2 === 0 ? ' home-feature--media-left' : ''}`} key={feature.title} data-home-reveal>
                <div className="home-feature-copy home-stagger">
                  <Heading as="h3" variant="title">{feature.title}</Heading>
                  <Text muted className="home-description">{feature.description}</Text>
                </div>
                <img className="home-feature-media home-stagger" src={feature.image} alt="" loading="lazy" decoding="async" width="768" height="1024" />
              </article>
            ))}
          </section>
          <StyleAdviceDemo />
        </div>
      </div>
    </div>
  )
}
