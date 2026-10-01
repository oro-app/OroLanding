import { useEffect, useRef } from 'react'
import outfitPhoto from '../../assets/fits/fri.webp'
import thinking from '../../assets/mascot/thinking.webp'
import SmsBubble from './SmsBubble'
import './ProductDemo.css'
import './StyleAdviceDemo.css'

export default function StyleAdviceDemo() {
  const sectionRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return undefined

    const section = sectionRef.current
    const messages = [...section.querySelectorAll('.product-demo-message')]
    messages.forEach((message) => { message.dataset.revealState = 'pending' })
    section.dataset.demoMotion = 'ready'
    let replyTimer

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        if (entry.target === messages[messages.length - 1]) {
          observer.unobserve(entry.target)
          replyTimer = window.setTimeout(() => { entry.target.dataset.revealState = 'shown' }, 220)
          return
        }
        entry.target.dataset.revealState = 'shown'
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.2, rootMargin: '0px 0px -18% 0px' })

    messages.forEach((message) => observer.observe(message))
    return () => {
      observer.disconnect()
      window.clearTimeout(replyTimer)
    }
  }, [])

  return (
    <section className="product-demo style-advice-demo" aria-labelledby="style-advice-demo-title" ref={sectionRef}>
      <div className="halo-container product-demo-inner">
        <h2 id="style-advice-demo-title" className="home-demo-title">send her the fit pic</h2>
        <p className="home-demo-description">running late? deciding between two outfits? wondering if something looks off? send Oro a photo and get a second opinion.</p>
        <ol className="product-demo-thread" role="list">
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right"><span className="sr-only">You: </span>Thoughts on this fit?</SmsBubble>
          </li>
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right">
              <span className="sr-only">You sent a photo: </span>
              <img src={outfitPhoto} alt="Pink top, white cardigan and pleated skirt, white sneakers, and a berry-colored bag" loading="lazy" decoding="async" width="408" height="560" />
            </SmsBubble>
          </li>
          <li className="product-demo-message style-advice-demo-reply--continued">
            <SmsBubble><span className="sr-only">Oro: </span>Pink and white is always such a cute color combo! </SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble avatar={thinking}><span className="sr-only">Oro: </span>I'd keep the sneakers for daytime. If you want to dress it up, try ballet flats instead :)</SmsBubble>
          </li>
        </ol>
      </div>
    </section>
  )
}
