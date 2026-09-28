import { Children, cloneElement, isValidElement } from 'react'
import GoldBackground from '../GoldBackground'
import { Button, Heading, Text } from 'oro-kit'
import { useBetaPages } from './useBetaPages'

function textContent(children) {
  return Children.toArray(children).map((child) => {
    if (typeof child === 'string' || typeof child === 'number') return String(child)
    if (!isValidElement(child)) return ''
    return child.type === 'br' ? ' ' : textContent(child.props.children)
  }).join('')
}

function TypedText({ children, duration = 1400, delay = '180ms', caret = false }) {
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
      <TypedText duration={1000} delay="180ms" caret>Help us make<br />Oro <em>yours.</em></TypedText>
    </Heading>
  )
}

export default function BetaIntroduction({ onStart, previewForm, initialPage, onNavigate }) {
  const { rootRef, stageRef, page, goTo } = useBetaPages(3, onStart, initialPage, onNavigate)
  const pages = [
    <section className="beta-chapter beta-chapter--hero" aria-labelledby="beta-title">
      <div className="beta-chapter-content">
        <TypingTitle />
        <Text muted className="beta-lead">We’re building toward a world where turning to your AI stylist is a normal part of everyday life.</Text>
        <Button className="beta-story-next" disabled={page.phase !== 'idle'} onClick={() => goTo(1)}>See beta details <span aria-hidden="true">→</span></Button>
      </div>
      <Text variant="support" muted className="beta-story-date">SEPTEMBER 26–OCTOBER 1, 2026</Text>
    </section>,
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
      <Button className="beta-story-next" disabled={page.phase !== 'idle'} onClick={() => goTo(2)}>Continue to invite <span aria-hidden="true">→</span></Button>
    </Chapter>,
    <Chapter id="request-an-invite" title={<>Ready to help us make Oro <em>yours?</em></>}>
      <Text muted>{previewForm ? 'Tell us a little about yourself to request a beta invite.' : 'Beta invites will open soon.'}</Text>
      <Button onClick={onStart}>{previewForm ? 'Request an invite' : 'Invites open soon'} <span aria-hidden="true">↗</span></Button>
      {previewForm && <Text variant="support" muted>Requesting an invite doesn’t guarantee selection.</Text>}
    </Chapter>,
  ]
  return (
    <div className="beta-story" ref={rootRef} data-scene={page.index % 3} data-phase={page.phase} data-direction={page.direction}>
      <div className="beta-story-halo" aria-hidden="true" />
      {page.index === 0 && <GoldBackground />}
      <div className="beta-story-stage" ref={stageRef} tabIndex={0} role="region" aria-label="About Oro">
        <div className="beta-story-page" key={page.index}>{pages[page.index]}</div>
      </div>
    </div>
  )
}
