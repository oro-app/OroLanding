import { Fragment } from 'react'
import GoldBackground from '../GoldBackground'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'
import ProductDemo from './ProductDemo'
import oroThumbsUp from '../../assets/mascot/oro_thumbs_up.webp'

const REASONS = ['It knows your closet', 'It answers in a minute', 'It tells you why']
const HEADLINE = 'The #1 AI stylist you can text'
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
        {wordIndex < words.length - 1 && ' '}
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
              Standing in front of your closet again? Ask oro, and head out feeling good
              about what you’re wearing.
            </Text>
            <div className="home-action">
              <HomeCta place="hero" className="home-enter">Join the beta</HomeCta>
            </div>
          </section>
          <ProductDemo />
          <section className="home-panel" aria-labelledby="home-moments-title" data-home-reveal>
            <Heading as="h2" variant="title" id="home-moments-title" className="home-stagger">Look like yourself.<br />{' '}Feel ready for anything.</Heading>
            <Text muted className="home-description home-stagger" style={{ '--home-delay': '120ms' }}>
              From everyday plans to big moments, oro helps you find a look you’ll feel good in.
            </Text>
          </section>
          <section className="home-panel home-reasons-panel" aria-labelledby="home-reasons-title" data-home-reveal>
            <Heading as="h2" variant="title" id="home-reasons-title" className="home-stagger">Why it works</Heading>
            <ul className="home-reasons">
              {REASONS.map((reason, index) => (
                <li key={reason} className="home-stagger" style={{ '--home-delay': `${180 + index * 110}ms` }}>
                  <svg className="home-check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M4 10.5 8 14.5 16 5.5" pathLength="1" />
                  </svg>
                  {reason}
                </li>
              ))}
            </ul>
            <img
              className="home-mascot home-mascot--thumbs-up home-stagger"
              src={oroThumbsUp}
              alt=""
              loading="lazy"
              decoding="async"
              width="1536"
              height="1536"
              style={{ '--home-delay': '510ms' }}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
