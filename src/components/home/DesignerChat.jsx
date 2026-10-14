import { useRef, useState } from 'react'
import outfit from '../../assets/fit-gen-demo/collage.webp'
import tryOn from '../../assets/fit-gen-demo/tryon.webp'
import jotting from '../../assets/mascot/jotting.webp'
import WhatsAppIcon from './WhatsAppIcons'
import { useDesignerChat } from './useDesignerChat'
import './ProductDemo.css'

const MESSAGES = [
  { side: 'right', text: "i'm going out for brunch with my friends", bubble: 'you-brunch.png', width: 402 },
  { side: 'left', text: 'i have the perfect look!', bubble: 'oro-perfect-look.png', width: 265 },
  { side: 'left', image: outfit, alt: 'Outfit collage with a cream cardigan, cherry-print top, flared jeans, red belt, silver hoops, and white sneakers' },
  { side: 'right', text: 'i wanna see it on me', bubble: 'you-see-it-on-me.png', width: 241 },
  { side: 'left', text: 'it looks stunning on you :)', bubble: 'oro-stunning.png', width: 293 },
  { side: 'left', image: tryOn, alt: 'Try-on with a cream cardigan, cherry-print top, red belt, and light blue flared jeans' },
]

function ChannelIcon({ whatsapp }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{whatsapp ? <>
    <path fill="#25D366" d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.26A9.5 9.5 0 1 0 12 2.5Z" />
    <path fill="#fff" d="M9.1 7.3c-.2-.45-.42-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.28-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.9 3.03 4.68 4.13 2.31.91 2.78.73 3.28.68.5-.04 1.62-.66 1.85-1.3.23-.64.23-1.19.16-1.3-.07-.12-.25-.19-.53-.33-.27-.13-1.62-.8-1.87-.89-.25-.09-.43-.13-.62.14-.18.27-.71.89-.87 1.07-.16.18-.32.2-.6.07-.27-.14-1.15-.43-2.2-1.36-.81-.72-1.36-1.62-1.52-1.9-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.46.1-.18.05-.34-.02-.48-.07-.13-.6-1.48-.84-2.03Z" />
  </> : <><rect width="24" height="24" rx="6" fill="#34C759" /><path fill="#fff" d="M12 5.5c-3.87 0-7 2.6-7 5.8 0 1.86 1.06 3.5 2.7 4.57-.12.9-.53 1.72-1.2 2.38 1.38-.08 2.65-.58 3.6-1.37.6.15 1.24.22 1.9.22 3.87 0 7-2.6 7-5.8s-3.13-5.8-7-5.8Z" /></>}</svg>
}

export default function DesignerChat() {
  const ref = useRef(null)
  const [channel, setChannel] = useState('imessage')
  const { shown, typing, reduced, clock } = useDesignerChat(ref, MESSAGES.length, channel)
  const [scrolled, setScrolled] = useState(false)
  return <section className={`oro-intro${reduced ? '' : ' oro-scrollchat'}`} ref={ref} data-channel={channel} aria-labelledby="product-demo-title">
    <div className="oro-intro-pin">
      <h2 className="oro-grid-title" id="product-demo-title"><span>text her when</span> <span>you don’t know what to wear</span></h2>
      <p className="oro-grid-sub">tell oro where you’re going, she’ll figure out the rest.</p>
      <div className="oro-channel" role="group" aria-label="Preview a conversation with oro">
        {['imessage', 'whatsapp'].map((option) => <button type="button" key={option} className="oro-channel-opt" aria-pressed={channel === option} onClick={() => setChannel(option)}>
          <ChannelIcon whatsapp={option === 'whatsapp'} /><span>for {option === 'whatsapp' ? 'WhatsApp' : 'iMessage'}</span>
        </button>)}
      </div>
      <div className="oro-phones">
        <div className="oro-phone3d-shadow" aria-hidden="true" />
        <div className="product-demo" data-analytics-section="outfit_demo" aria-hidden={channel !== 'imessage'}>
          <div className="halo-container product-demo-inner" data-oro-time={clock}>
            <ol className={`product-demo-thread${scrolled ? ' oro-scrolled' : ''}`} role="list" tabIndex={channel === 'imessage' ? 0 : -1} aria-label="iMessage conversation demo" onScroll={(event) => setScrolled(event.currentTarget.scrollTop > .5)}>
              {MESSAGES.map((message, index) => <li key={index} aria-hidden={index >= shown}
                className={`product-demo-message${message.side === 'right' ? ' product-demo-message--user' : ''}${message.image ? ' oro-chat-photo' : ' oro-chat-swapped'}${index >= shown ? ' oro-chat-pending' : ''}`}>
                {message.image ? <div className="sms-bubble"><img className={index < shown ? 'oro-chat-pop' : ''} src={message.image} alt={message.alt} width="480" height="640" decoding="async" /></div> :
                  <span className={`oro-chat-msg oro-chat-msg--${message.side}`}>
                    <img className={index < shown ? 'oro-chat-pop' : ''} src={`/oro-chat/${message.bubble}`} style={{ '--oro-chat-w': message.width }} alt={`${message.side === 'right' ? 'you' : 'oro'}: ${message.text}`} />
                    <span className={`oro-chat-typing${typing === index ? ' is-on' : ''}`} aria-hidden="true"><i /><i /><i /></span>
                  </span>}
              </li>)}
            </ol>
          </div>
        </div>
        <div className="oro-wa-phone" aria-hidden={channel !== 'whatsapp'}>
          <div className="oro-wa-screen">
            <div className="oro-wa-head" aria-hidden="true"><WhatsAppIcon name="back" />
              <span className="oro-wa-avatar" style={{ backgroundImage: `url(${jotting})` }} />
              <span className="oro-wa-who"><span className="oro-wa-name">oro</span><span className={`oro-wa-status${typing !== null && MESSAGES[typing]?.side === 'left' && !MESSAGES[typing]?.image ? ' is-typing' : ''}`}>{typing !== null && MESSAGES[typing]?.side === 'left' && !MESSAGES[typing]?.image ? 'typing…' : 'online'}</span></span>
              <WhatsAppIcon name="video" /><WhatsAppIcon name="call" />
            </div>
            <div className="oro-wa-chat" tabIndex={channel === 'whatsapp' ? 0 : -1} role="region" aria-label="WhatsApp conversation demo"><ol className="oro-wa-thread">
              <li className="oro-wa-day">Today</li>
              {MESSAGES.map((message, index) => <li key={index} aria-hidden={index >= shown}
                className={`oro-wa-msg oro-wa-msg--${message.side === 'right' ? 'out' : 'in'}${index === 0 || MESSAGES[index - 1].side !== message.side ? ' oro-wa-msg--tail' : ''}${index < shown ? ' is-in' : ' is-pending'}`}>
                <div className={`oro-wa-bubble${message.image ? ' oro-wa-bubble--photo' : ''}`}>
                  {message.image ? <img src={message.image} alt={message.alt} width="480" height="640" decoding="async" /> : <><span className="sr-only">{message.side === 'right' ? 'you' : 'oro'}: </span>{message.text}</>}
                  <span className="oro-wa-meta" aria-hidden="true">8:0{index}{message.side === 'right' && <WhatsAppIcon name="ticks" />}</span>
                </div>
              </li>)}
            </ol></div>
            <div className="oro-wa-bar" aria-hidden="true"><WhatsAppIcon name="plus" /><span className="oro-wa-input"><WhatsAppIcon name="sticker" /></span><WhatsAppIcon name="camera" /><WhatsAppIcon name="mic" /></div>
          </div>
          <img className="oro-wa-frame" src="/oro-wa/phone-frame.png" alt="" draggable="false" />
          <span className="oro-wa-clock" aria-hidden="true">{clock}</span>
        </div>
      </div>
    </div>
  </section>
}
