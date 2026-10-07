import { useEffect, useRef } from 'react'
import jeansLook from '../../assets/fit-gen-demo/mens-jeans.webp'
import cargosLook from '../../assets/fit-gen-demo/mens-cargos.webp'
import jotting from '../../assets/mascot/jotting.webp'
import aww from '../../assets/mascot/aww.webp'
import SmsBubble from './SmsBubble'
import './ProductDemo.css'

export default function IterationDemo({ title, description }) {
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
    <section className="product-demo iteration-demo" aria-labelledby="iteration-demo-title" ref={sectionRef} data-analytics-section="outfit_iteration_demo">
      <div className="halo-container product-demo-inner">
        <h2 id="iteration-demo-title" className="home-demo-title">{title}</h2>
        <p className="home-demo-description">{description}</p>
        <ol className="product-demo-thread" role="list">
          <li className="product-demo-message">
            <SmsBubble><span className="sr-only">oro: </span>how’s this?</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble avatar={jotting}>
              <span className="sr-only">oro: </span>
              <img src={jeansLook} alt="men’s streetwear look with a brown leather jacket, graphic tee, baggy jeans, silver sneakers, burgundy beanie, crossbody bag, sunglasses, belt, and silver jewelry" loading="lazy" decoding="async" width="1086" height="1448" />
            </SmsBubble>
          </li>
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right"><span className="sr-only">you: </span>can we try cargos instead?</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble><span className="sr-only">oro: </span>olive cargos. so good with the brown leather.</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble avatar={aww}>
              <span className="sr-only">oro: </span>
              <img src={cargosLook} alt="the same layered streetwear look and accessories, with olive cargos replacing the jeans" loading="lazy" decoding="async" width="1086" height="1448" />
            </SmsBubble>
          </li>
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right"><span className="sr-only">you: </span>yes, that’s the one</SmsBubble>
          </li>
        </ol>
      </div>
    </section>
  )
}
