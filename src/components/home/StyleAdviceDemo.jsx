import { useEffect, useRef } from 'react'
import outfitPhoto from '../../assets/fits/fri.webp'
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

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.dataset.revealState = 'shown'
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.2, rootMargin: '0px 0px -18% 0px' })

    messages.forEach((message) => observer.observe(message))
    return () => observer.disconnect()
  }, [])

  return (
    <section className="product-demo style-advice-demo" aria-labelledby="style-advice-demo-title" ref={sectionRef}>
      <div className="halo-container product-demo-inner">
        <h2 id="style-advice-demo-title" className="sr-only">Get style advice from oro</h2>
        <ol className="product-demo-thread" role="list">
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right"><span className="sr-only">You: </span>What do you think of this outfit? Any styling advice?</SmsBubble>
          </li>
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right">
              <span className="sr-only">You sent a photo: </span>
              <img src={outfitPhoto} alt="Pink top, white cardigan and pleated skirt, white sneakers, and a berry-colored bag" loading="lazy" decoding="async" width="408" height="560" />
            </SmsBubble>
          </li>
          <li className="product-demo-message style-advice-demo-reply--continued">
            <SmsBubble><span className="sr-only">Oro: </span>The berry bag gives the soft pink and white a great pop of color.</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble><span className="sr-only">Oro: </span>I'd keep the sneakers for daytime. If you want to dress it up, try ballet flats instead.</SmsBubble>
          </li>
        </ol>
      </div>
    </section>
  )
}
