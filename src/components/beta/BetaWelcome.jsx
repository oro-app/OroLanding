import { useEffect, useRef, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { HomeCta } from '../home/HomeChrome'
import SmsBubble from '../home/SmsBubble'
import mascot from '../../assets/mascot/oro_hi.webp'
import careerOutfit from '../../assets/poster-campaign/career.webp'
import datingOutfit from '../../assets/poster-campaign/dating.webp'

const openings = {
  general: {
    title: 'heard you were looking for my number.',
    prompt: 'help, i have no idea what to wear tonight.',
    advice: 'say less. what are we dressing for?',
  },
  career: {
    title: 'got the interview?', copy: 'your résumé got you in the room. i’ll handle the outfit.',
    prompt: 'interview tomorrow. polished, but still me?', image: careerOutfit,
    alt: 'interview outfit with a charcoal blazer and trousers, ivory knit, oxblood loafers and bag, and silver accessories',
    advice: 'charcoal keeps it sharp. the oxblood shoes and bag add personality without distracting from you.',
  },
  dating: {
    title: 'first date. third outfit change?', copy: 'you got the date. i’ll handle the outfit.',
    prompt: 'first date. somewhere nice, but not too fancy.', image: datingOutfit,
    alt: 'date-night outfit with a brown suede jacket, ecru knit, dark jeans, leather loafers, and silver accessories',
    advice: 'suede, dark denim, a little silver. tuck the knit so the jacket hits cleanly at your waist.',
  },
}

function WelcomeChat({ opening }) {
  const [messages, setMessages] = useState([
    { from: 'you', text: opening.prompt },
    { from: 'oro', text: opening.advice, image: opening.image, alt: opening.alt },
  ])
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const threadRef = useRef(null)
  const timerRef = useRef()

  useEffect(() => () => clearTimeout(timerRef.current), [])
  useEffect(() => threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight }), [messages, typing])

  const sendMessage = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || typing) return
    setMessages((current) => [...current, { from: 'you', text }])
    setDraft('')
    setTyping(true)
    timerRef.current = setTimeout(() => {
      setMessages((current) => [...current, { from: 'oro', text: 'i’m on it. tell me the vibe and i’ll build the look ✨' }])
      setTyping(false)
    }, 700)
  }

  return <div className="beta-welcome-chat" aria-label="Chat with oro">
    <div className="beta-chat-bar">
      <span aria-hidden="true">‹</span>
      <div><img src={mascot} alt="" width="42" height="42" /><strong>oro</strong></div>
      <span aria-hidden="true" />
    </div>
    <div className="beta-chat-thread" ref={threadRef} role="log" aria-live="polite" aria-relevant="additions">
      <p className="beta-chat-time">Today 8:42 AM</p>
      {messages.map((message, index) => <div className={`beta-chat-message beta-chat-message--${message.from}`} key={`${message.from}-${index}`}>
        <SmsBubble tone={message.from === 'you' ? 'dark-purple' : 'cream'} side={message.from === 'you' ? 'right' : 'left'}>
          <span className="beta-sr-only">{message.from}: </span>{message.text}
        </SmsBubble>
        {message.image && <img className="beta-chat-outfit" src={message.image} alt={message.alt} width="1086" height="1448" fetchpriority="high" decoding="async" />}
      </div>)}
      {typing && <div className="beta-chat-typing" aria-label="oro is typing"><i /><i /><i /></div>}
    </div>
    <form className="beta-chat-compose" onSubmit={sendMessage}>
      <label className="beta-sr-only" htmlFor="beta-chat-message">Message oro</label>
      <input id="beta-chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="iMessage" autoComplete="off" />
      <button type="submit" aria-label="Send message" disabled={typing}><span aria-hidden="true">↑</span></button>
    </form>
  </div>
}

export default function BetaWelcome({ campaign, inviteUrl = '' }) {
  const opening = openings[campaign] || openings.general
  return <section className="beta-application beta-welcome" aria-labelledby="welcome-title" data-campaign={campaign}>
    <div className="beta-story-halo" aria-hidden="true" />
    <div className="beta-form-panel beta-welcome-layout beta-welcome-layout--example">
      <div className="beta-welcome-content">
        <Heading as="h1" variant="title" id="welcome-title">{opening.title}</Heading>
        {opening.copy && <Text className="beta-welcome-copy">{opening.copy}</Text>}
        <Text className="beta-welcome-intro">your personal ai stylist,<br />right in your texts.</Text>
        <HomeCta place={`beta_${campaign}`} className="beta-welcome-cta" inviteUrl={inviteUrl}>want her number?</HomeCta>
      </div>
      <WelcomeChat opening={opening} />
    </div>
  </section>
}
