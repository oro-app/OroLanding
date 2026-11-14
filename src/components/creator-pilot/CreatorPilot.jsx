import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import ButtonArrow from '../ButtonArrow'
import GoldBackground from '../GoldBackground'
import { HomeCta } from '../home/HomeChrome'
import CreatorApplication from './CreatorApplication'
import './CreatorPilot.css'

const applicationDate = '2026-11-20'
const applicationDeadline = Date.parse('2026-11-21T00:00:00-05:00')

const features = [
  ['Digitize your closet', 'Turn photos of your clothes into a digital closet so you can see what you own.'],
  ['Make outfits from your clothes', 'Tell her where you’re going and she’ll put together something you can wear.'],
  ['Get a second opinion', 'Text her a fitting-room photo and ask, “Should I buy this?” Or send her your outfit and ask, “How do I make this fit better?”'],
]

const topics = [
  ['Personal style', 'Everyday fashion, streetwear, menswear, modest fashion, petite style, tall fashion, plus-size style, minimalist fashion, maximalist fashion, vintage style, workwear, occasionwear'],
  ['Closets and shopping', 'Thrifting, secondhand fashion, affordable fashion, capsule wardrobes, outfit repeating, sustainable fashion, low-buy living, closet organization, wardrobe building, clothing resale'],
  ['Campus and student life', 'Campus culture, dorm life, university lifestyle, commuter student life, study abroad, student budgeting, co-op life, sorority life'],
  ['Early career and work life', 'Internship life, new-grad lifestyle, office culture, corporate life, freelancing, working from home, entrepreneurship'],
  ['Lifestyle', 'City living, dating, social life, morning routines, busy lifestyles, small-space living, travel, carry-on travel, living on a budget'],
  ['Beauty and personal care', 'Makeup, hair, skincare, nails, fragrance, beauty on a budget, personal grooming'],
  ['Comedy and culture', 'Fashion humor, campus humor, workplace humor, dating comedy, roommate comedy, internet culture, trend commentary, pop culture commentary'],
  ['Tech and organization', 'Consumer tech, AI tools, app discovery, digital organization, productivity, smart shopping tools'],
]

const creatorTraits = [
  ['A feel for storytelling', 'You enjoy finding a clear way to tell a story on camera or through voiceover.'],
  ['An eye for editing', 'You think about when to tighten a cut and when to let a moment breathe.'],
  ['A voice of your own', 'You can take a script and make it sound like you.'],
  ['Openness to feedback', 'You’re willing to try a different take or revise an edit after getting notes.'],
  ['Follow-through', 'You can plan your work and deliver it on time.'],
]

const formats = ['Talking-head videos', 'Vlogs', 'Get ready with me', 'Skits', 'Challenges']

const benefits = [
  ['Scripts and formats ready to use', 'You’ll have plenty of hooks, scripts, and video structures to choose from, with room to make the delivery your own.'],
  ['1:1 mentorship with the oro team', 'Bring whatever you’re working through, whether that’s content creation, tech, product, your career, entrepreneurship, or something you want to build.'],
  ['A creator community you can stay part of after the pilot', 'Meet people you can share ideas with, ask for feedback, and keep creating alongside after the six weeks.'],
  ['Paid brand work for your portfolio', 'Build a set of videos you can show future brands and employers, with real performance data to talk about what worked.'],
]

function ApplicationCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(null)

  useEffect(() => {
    const update = () => {
      const remaining = Math.max(0, Math.ceil((applicationDeadline - Date.now()) / 1000))
      setSecondsLeft(remaining)
      return remaining > 0
    }

    if (!update()) return

    const interval = window.setInterval(() => {
      if (!update()) window.clearInterval(interval)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  if (secondsLeft === null) {
    return <Text className="pilot-countdown" aria-hidden="true">{'\u00a0'}</Text>
  }
  if (secondsLeft === 0) return <Text className="pilot-countdown">The application deadline has passed.</Text>

  const days = Math.floor(secondsLeft / 86400)
  const hours = Math.floor(secondsLeft / 3600) % 24
  const minutes = Math.floor(secondsLeft / 60) % 60
  const seconds = secondsLeft % 60

  return (
    <Text className="pilot-countdown">
      <span role="timer" aria-label="Time left to apply">
        {days} {days === 1 ? 'day' : 'days'} · {hours} hr · {minutes} min · {seconds} sec
      </span>
    </Text>
  )
}

function PilotList({ items }) {
  return (
    <ul className="pilot-list">
      {items.map(([title, copy]) => (
        <li key={title}>
          <Heading as="h3" variant="subheading">{title}</Heading>
          <Text muted>{copy}</Text>
        </li>
      ))}
    </ul>
  )
}

export default function CreatorPilot() {
  const pageRef = useRef(null)

  useEffect(() => {
    if (window.location.hash === '#apply') {
      pageRef.current.querySelector('#apply').scrollIntoView({ behavior: 'instant' })
    }

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          delete entry.target.dataset.pilotPending
          observer.unobserve(entry.target)
        }
      }
    })

    const sections = [...pageRef.current.querySelectorAll('[data-pilot-reveal]')]
    for (const section of sections) {
      if (section.getBoundingClientRect().top >= window.innerHeight) {
        section.dataset.pilotPending = ''
        observer.observe(section)
      }
    }

    return () => {
      observer.disconnect()
      sections.forEach((section) => delete section.dataset.pilotPending)
    }
  }, [])

  return (
    <div className="creator-pilot" ref={pageRef}>
      <GoldBackground />

      <section className="pilot-intro" aria-labelledby="pilot-title">
        <div className="pilot-container">
          <div className="pilot-hero">
            <Heading as="h1" variant="display" id="pilot-title" className="pilot-title">
              oro creators
            </Heading>
            <Text muted className="pilot-lede">
              Like making videos? Come get paid to make them with oro.
            </Text>
            <div className="pilot-action">
              <HomeCta place="hero" href="#apply" showIcon={false}>Apply</HomeCta>
            </div>
          </div>
          <div className="pilot-deadline">
            <Text className="pilot-deadline-date">Apply by <time dateTime={applicationDate}>November 20th</time></Text>
            <ApplicationCountdown />
          </div>
        </div>
      </section>

      <section className="pilot-section pilot-container" aria-labelledby="pilot-about" data-pilot-reveal>
        <div className="pilot-section-heading">
          <Heading as="h2" variant="title" id="pilot-about">What’s oro?</Heading>
          <Text muted>oro is an AI fashion advisor you can text.</Text>
          <a className="pilot-about-link" href="/" target="_blank" rel="noopener">
            Explore oro <ButtonArrow direction="up-right" className="pilot-arrow" />
          </a>
        </div>
        <PilotList items={features} />
      </section>

      <section className="pilot-section pilot-container" aria-labelledby="pilot-deliverables" data-pilot-reveal>
        <div className="pilot-section-heading">
          <Heading as="h2" variant="title" id="pilot-deliverables">What we’re looking for</Heading>
        </div>
        <div className="pilot-deliverables">
          <ul className="pilot-bullets">
            <li><strong>Two original short-form videos per week for six weeks.</strong></li>
            <li>Post links and basic analytics for each video so we can see how it performed.</li>
            <li>Someone who can bring a script to life, hit deadlines, and try feedback on the next video.</li>
          </ul>
          <Heading as="h3" variant="subheading">What you could make</Heading>
          <ul className="pilot-formats" aria-label="Example video formats">
            {formats.map((format) => <li key={format}>{format}</li>)}
          </ul>
        </div>
      </section>

      <section className="pilot-benefits" aria-labelledby="pilot-benefits">
        <div className="pilot-section pilot-container" data-pilot-reveal>
          <Heading as="h2" variant="title" id="pilot-benefits">What you get</Heading>
          <div className="pilot-pay">
            <Heading as="h3" variant="subheading">Pilot compensation</Heading>
            <dl>
              <div>
                <dt>Base pay for 12 videos</dt>
                <dd>$300</dd>
              </div>
              <div>
                <dt>In view bonuses, up to</dt>
                <dd>$100</dd>
              </div>
            </dl>
            <Text>$25 per video plus $1 CPM on eligible views.</Text>
          </div>
          <PilotList items={benefits} />
        </div>
      </section>

      <section className="pilot-fit" aria-labelledby="pilot-fit">
        <div className="pilot-section pilot-container" data-pilot-reveal>
          <div className="pilot-section-heading">
            <Heading as="h2" variant="title" id="pilot-fit">Who might be a good fit?</Heading>
            <Text muted>If you like telling stories on camera or through voiceover, care about how a video is edited, and enjoy trying things based on feedback, we’d love to see your work.</Text>
          </div>
          <div className="pilot-disclosures">
            <details>
              <summary>What you might post about <span className="pilot-disclosure-icon" aria-hidden="true" /></summary>
              <PilotList items={topics} />
            </details>
            <details>
              <summary>Traits we look for <span className="pilot-disclosure-icon" aria-hidden="true" /></summary>
              <PilotList items={creatorTraits} />
            </details>
          </div>
        </div>
      </section>

      <section className="pilot-apply" id="apply" aria-labelledby="pilot-apply-title" tabIndex={-1}>
        <div className="pilot-container" data-pilot-reveal>
          <Heading as="h2" variant="title" id="pilot-apply-title">Interested?</Heading>
          <Text muted>Apply by <time dateTime={applicationDate}>November 20th</time>.</Text>
          <CreatorApplication />
        </div>
      </section>
    </div>
  )
}
