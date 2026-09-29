import { Children, cloneElement, isValidElement } from 'react'
import GoldBackground from '../GoldBackground'
import ButtonArrow from '../ButtonArrow'
import { Button, Heading, Text } from 'oro-kit'
import { useBetaPages } from './useBetaPages'

const TYPE_STEP = 34

function textContent(children) {
  return Children.toArray(children).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child)
    if (!isValidElement(child)) return ''
    return child.type === 'br' ? ' ' : textContent(child.props.children)
  }).join('')
}

function TypedText({ children }) {
  const text = textContent(children)
  let position = 0
  const render = (nodes) => Children.map(nodes, (node) => {
    if (typeof node === 'string' || typeof node === 'number') {
      return String(node).split(/(\s+)/).map((word, wordIndex) => {
        if (/^\s+$/.test(word)) return word
        return <span key={wordIndex} className="home-type-word">{[...word].map((letter) => {
          const index = position++
          return <span key={index} className="home-type-char" style={{ '--home-char-delay': `${80 + index * TYPE_STEP}ms` }}>{letter}</span>
        })}</span>
      })
    }
    if (!isValidElement(node)) return node
    if (node.type === 'br') return node
    return cloneElement(node, {}, render(node.props.children))
  })
  return <span><span className="beta-sr-only">{text}</span><span aria-hidden="true">{render(children)}</span></span>
}

function Chapter({ id, title, children, className = '' }) {
  return (
    <section id={id} className={`beta-chapter ${className}`} aria-labelledby={`${id}-title`}>
      <div className="beta-chapter-content">
        <Heading as="h2" variant="title" id={`${id}-title`} tabIndex={-1}>{title}</Heading>
        <div className="beta-chapter-copy">{children}</div>
      </div>
    </section>
  )
}

function TypingTitle() {
  return (
    <Heading as="h1" variant="display" id="beta-title" tabIndex={-1} className="beta-typing-title">
      <TypedText>Help us make<br />Oro <em>yours.</em></TypedText>
    </Heading>
  )
}

function LandingStep({ disabled, onNext }) {
  return (
    <section className="beta-chapter beta-chapter--hero" aria-labelledby="beta-title">
      <div className="beta-chapter-content">
        <TypingTitle />
        <Text muted className="beta-lead">We’re building toward a world where turning to your AI stylist is a normal part of everyday life.</Text>
        <Button className="beta-story-next" disabled={disabled} onClick={onNext}>See beta details <ButtonArrow /></Button>
      </div>
      <Text variant="support" muted className="beta-story-date">SEPTEMBER 26–OCTOBER 1, 2026</Text>
    </section>
  )
}

function BetaDetailsStep({ disabled, onNext }) {
  return (
    <Chapter id="tester-value" title={<>Help shape the future of <em>Oro.</em></>} className="beta-chapter--benefits">
      <div className="beta-expectations">
        <Text muted>As a beta tester, you’ll use Oro with your real clothes and plans, then tell us what works and what needs to improve.</Text>
        <ul className="beta-checklist">
          {['Try Oro during the September 26–October 1 beta.', 'Share honest feedback so we know what to build next.'].map((item) => (
            <li key={item}><span className="beta-checkmark" aria-hidden="true">✓</span>{item}</li>
          ))}
        </ul>
      </div>
      <Text variant="label" muted className="beta-review-disclosure">Our team will review your beta conversations, photos you share, and feedback to improve Oro.</Text>
      <ul className="beta-benefit-list">
        <li><span aria-hidden="true">01</span><div><strong>Free lifetime access to Oro.</strong></div></li>
        <li><span aria-hidden="true">02</span><div><strong>Future referral codes for your friends.</strong></div></li>
        <li><span aria-hidden="true">03</span><div><strong>An invitation to our Oronauts beta group chat.</strong></div></li>
        <li><span aria-hidden="true">04</span><div><strong>Free Oro merch.</strong></div></li>
      </ul>
      <Button className="beta-story-next" disabled={disabled} onClick={onNext}>Continue to invite <ButtonArrow /></Button>
    </Chapter>
  )
}

function InviteStep({ onStart, previewForm }) {
  return (
    <Chapter id="request-an-invite" title={<>Ready to help us make Oro <em>yours?</em></>}>
      <Text muted>{previewForm ? 'Tell us a little about yourself to request a beta invite.' : 'Beta invites will open soon.'}</Text>
      <Button onClick={onStart}>{previewForm ? 'Request an invite' : 'Invites open soon'} <ButtonArrow direction="up-right" /></Button>
      {previewForm && <Text variant="support" muted>Requesting an invite doesn’t guarantee selection.</Text>}
    </Chapter>
  )
}

export default function BetaIntroduction({ onStart, previewForm, initialPage, onNavigate }) {
  const { rootRef, stageRef, page, goTo } = useBetaPages(3, onStart, initialPage, onNavigate)
  const activeStep = page.index === 0
    ? <LandingStep disabled={page.phase !== 'idle'} onNext={() => goTo(1)} />
    : page.index === 1
      ? <BetaDetailsStep disabled={page.phase !== 'idle'} onNext={() => goTo(2)} />
      : <InviteStep onStart={onStart} previewForm={previewForm} />

  return (
    <div className="beta-story" ref={rootRef} data-scene={page.index % 3} data-phase={page.phase} data-direction={page.direction}>
      <div className="beta-story-halo" aria-hidden="true" />
      {page.index === 0 && <GoldBackground />}
      <div className="beta-story-stage" ref={stageRef} tabIndex={0} role="region" aria-label="About Oro">
        <div className="beta-story-page" key={page.index}>{activeStep}</div>
      </div>
    </div>
  )
}
