import { Children, cloneElement, isValidElement } from 'react'
import { Button, Heading, Text } from 'oro-kit'
import { useBetaPages } from './useBetaPages'

function textContent(children) {
  return Children.toArray(children).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child)
    if (!isValidElement(child)) return ''
    return child.type === 'br' ? ' ' : textContent(child.props.children)
  }).join('')
}

export function TypedText({ children, duration = 1400, delay = 'var(--beta-copy-delay, 1800ms)', caret = false }) {
  const text = textContent(children)
  const length = [...text].length
  const interval = duration / Math.max(length - 1, 1)
  let position = 0
  const render = (nodes) => Children.map(nodes, (node) => {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node).split(/(\s+)/).map((word, wordIndex) => {
        if (/^\s+$/.test(word)) { position += word.length; return word }
        return <span key={wordIndex} className="beta-type-word">{[...word].map((letter) => {
          const index = position++
          return <span key={index} className={`beta-type-char${index === length - 1 ? ' beta-type-char--last' : ''}`} style={{ '--type-delay': `calc(${delay} + ${index * interval}ms)`, '--type-hold': `${interval}ms` }}>{letter}</span>
        })}</span>
      })
    }
    if (!isValidElement(node)) return node
    if (node.type === 'br') { position++; return node }
    return cloneElement(node, {}, render(node.props.children))
  })
  return <span className={caret ? 'beta-typed-text beta-type-with-caret' : 'beta-typed-text'}><span className="beta-sr-only">{text}</span><span aria-hidden="true">{render(children)}</span></span>
}

function Chapter({ id, title, children, className = '' }) {
  const duration = Math.min(2200, textContent(title).length * 36)
  return (
    <section id={id} className={`beta-chapter ${className}`} aria-labelledby={`${id}-title`} style={{ '--beta-copy-delay': `${duration + 260}ms` }}>
      <div className="beta-chapter-content">
        <Heading as="h2" variant="title" id={`${id}-title`} tabIndex={-1} className="beta-typing-title"><TypedText duration={duration} delay="100ms" caret>{title}</TypedText></Heading>
        <div className="beta-chapter-copy">{children}</div>
      </div>
    </section>
  )
}

function TypingTitle() {
  return (
    <Heading as="h1" variant="display" id="beta-title" tabIndex={-1} className="beta-typing-title">
      <TypedText duration={1600} delay="180ms" caret>Help us make<br />Oro <em>yours.</em></TypedText>
    </Heading>
  )
}

export default function BetaIntroduction({ onStart, previewForm }) {
  const pages = [
    <section className="beta-chapter beta-chapter--hero" aria-labelledby="beta-title">
      <div className="beta-chapter-content">
        <TypingTitle />
        <Text muted className="beta-lead"><TypedText>We’re building toward a world where turning to your AI stylist is a normal part of everyday life.</TypedText></Text>
      </div>
      <Text variant="support" muted className="beta-story-date">SEPTEMBER 25–30, 2026</Text>
    </section>,
    <Chapter id="our-vision" title={<>Our vision is for everyone to have an AI stylist <em>in their corner.</em></>}>
      <Text muted><TypedText>A stylist that gets to know your taste, understands your wardrobe, remembers your preferences, and helps you make decisions that work for your life.</TypedText></Text>
    </Chapter>,
    <Chapter id="over-imessage" title={<>Today, we’re testing the earliest version of that experience with you.</>}>
      <Text muted><TypedText>There’s still a lot to build and improve, and this beta will help us understand what deserves our attention next.</TypedText></Text>
    </Chapter>,
    <Chapter id="the-beginning" title={<>Oro has been accepted into an accelerator, so <em>things are moving quickly.</em></>}>
      <Text muted><TypedText>You’re getting involved at the start of something we’re really excited to grow.</TypedText></Text>
    </Chapter>,
    <Chapter id="the-week" title={<>The beta runs <em>September 25–30.</em></>}>
      <div className="beta-expectations">
        <Text muted><TypedText duration={700}>What we need from you:</TypedText></Text>
        <ul className="beta-checklist">
          {['Try Oro with your real clothes and everyday plans.', 'Share feedback after selected interactions.', 'Complete a daily check-in.', 'Give us an end-of-beta review.'].map((item, index) => (
            <li key={item}><span className="beta-checkmark" aria-hidden="true">✓</span><TypedText delay={`calc(var(--beta-copy-delay) + ${600 + index * 180}ms)`} duration={900}>{item}</TypedText></li>
          ))}
        </ul>
      </div>
      <Text variant="label" muted className="beta-review-disclosure"><TypedText delay="calc(var(--beta-copy-delay) + 1400ms)">Our team will review your beta conversations, any photos you share, and your feedback to understand your experience and improve Oro.</TypedText></Text>
    </Chapter>,
    <Chapter id="be-honest" title={<>Please don’t tell us it’s good <em>just to be nice.</em></>} className="beta-chapter--honest">
      <Text muted><TypedText>If an outfit suggestion sucks, tell us. If something is confusing, frustrating, or more effort than it’s worth, tell us.</TypedText></Text>
    </Chapter>,
    <Chapter id="a-little-thank-you" title={<>As a thank-you, selected beta testers <em>will get:</em></>} className="beta-chapter--benefits">
      <ul className="beta-benefit-list">
        <li><span aria-hidden="true">01</span><div><strong><TypedText duration={1000}>Free lifetime access to Oro.</TypedText></strong></div></li>
        <li><span aria-hidden="true">02</span><div><strong><TypedText duration={1000}>Future referral codes for your friends</TypedText></strong></div></li>
        <li><span aria-hidden="true">03</span><div><strong><TypedText duration={1000}>An invitation to our Oronauts beta group chat</TypedText></strong></div></li>
        <li><span aria-hidden="true">04</span><div><strong><TypedText duration={1000}>Free Oro merch.</TypedText></strong></div></li>
      </ul>
      {previewForm && <Text muted><TypedText>Tell us a little about yourself below to <strong>request an invite</strong> :)</TypedText></Text>}
      <Button onClick={onStart}>{previewForm ? 'Request an invite' : 'Invites open soon'} <span aria-hidden="true">↗</span></Button>
      {previewForm && <Text variant="support" muted>Requesting an invite doesn’t guarantee selection.</Text>}
    </Chapter>,
  ]
  const { rootRef, stageRef, page, goTo } = useBetaPages(pages.length, onStart)
  return (
    <div className="beta-story" ref={rootRef} data-scene={page.index % 3} data-phase={page.phase} data-direction={page.direction}>
      <div className="beta-story-halo" aria-hidden="true" />
      <div className="beta-story-stage" ref={stageRef} tabIndex={0} role="region" aria-label="About Oro">
        <div className="beta-story-page" key={page.index}>{pages[page.index]}</div>
      </div>
      <nav className="beta-story-nav" aria-label="Invitation pages">
        <button type="button" className="beta-page-arrow" aria-label={page.index === pages.length - 1 ? (previewForm ? 'Go to the form' : 'About beta invites') : 'Next page'} aria-disabled={page.phase !== 'idle' || undefined} onClick={() => { if (page.phase === 'idle') page.index === pages.length - 1 ? onStart() : goTo(page.index + 1) }}><span aria-hidden="true">→</span></button>
      </nav>
    </div>
  )
}
