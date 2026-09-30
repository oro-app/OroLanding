import { useEffect, useRef } from 'react'
import outfit from '../../assets/fit-gen-demo/collage.webp'
import tryOn from '../../assets/fit-gen-demo/tryon.webp'
import SmsBubble from './SmsBubble'
import './ProductDemo.css'

export default function ProductDemo() {
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
    <section className="product-demo" aria-labelledby="product-demo-title" ref={sectionRef}>
      <div className="halo-container product-demo-inner">
        <h2 id="product-demo-title" className="sr-only">Get dressed in a conversation</h2>
        <ol className="product-demo-thread" role="list">
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right"><span className="sr-only">You: </span>I'm going out for brunch with friends</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble><span className="sr-only">Oro: </span>I have the perfect look!</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble>
              <span className="sr-only">Oro: </span>
              <img src={outfit} alt="Outfit collage with a cream cardigan, cherry-print top, flared jeans, red belt, silver hoops, and white sneakers" loading="lazy" decoding="async" width="1086" height="1448" />
            </SmsBubble>
          </li>
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right"><span className="sr-only">You: </span>I wanna see it on me</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble><span className="sr-only">Oro: </span>It looks perfect on you :)</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble>
              <span className="sr-only">Oro: </span>
              <img src={tryOn} alt="Try-on with a cream cardigan, cherry-print top, red belt, and light blue flared jeans" loading="lazy" decoding="async" width="480" height="640" />
            </SmsBubble>
          </li>
        </ol>
      </div>
    </section>
  )
}
