import { Fragment } from 'react'
import GoldBackground from '../GoldBackground'
import { Heading, Text } from 'oro-kit'
import MessageThread from './MessageThread'
import { HomeCta } from './HomeChrome'
import { useHomeMotion } from './useHomeMotion'

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
              Standing in front of your closet again? Ask Oro, and head out feeling good
              about what you’re wearing.
            </Text>
            <div className="home-action">
              <HomeCta place="hero" className="home-enter">Start the conversation</HomeCta>
              <Text variant="support" muted className="home-beta-note home-enter">Currently in beta.</Text>
            </div>
          </section>
          <section className="home-panel" aria-labelledby="home-moments-title" data-home-reveal>
            <Heading as="h2" variant="title" id="home-moments-title" className="home-stagger">Look like yourself. Feel ready for anything.</Heading>
            <Text muted className="home-description home-stagger" style={{ '--home-delay': '120ms' }}>
              You know how you want to feel when you walk into a room. Getting dressed for it can
              be harder. Oro helps you find your look, whatever your plans.
            </Text>
          </section>
          <section className="home-panel" aria-labelledby="home-reasons-title" data-home-reveal>
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
            <Text muted className="home-reason-note home-stagger" style={{ '--home-delay': '510ms' }}>It gets more personal every time.</Text>
          </section>
        </div>
        <div className="home-phone-column">
          <div className="home-phone-sticky">
            <div className="home-phone-glow" aria-hidden="true" />
            <MessageThread startDelay={1100} />
          </div>
        </div>
      </div>
      <section className="home-closer halo-container" aria-labelledby="closer-title" data-home-reveal>
        <Heading as="h2" variant="title" id="closer-title" className="home-stagger">Whatever the day is,<br /><em>you’re dressed for it.</em></Heading>
        <HomeCta place="closer" className="home-stagger">Start the conversation</HomeCta>
      </section>
    </div>
  )
}
