import { useEffect, useRef } from 'react'
import outfitPhoto from '../../assets/fits/mens-streetwear.jpg'
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
        <p className="home-demo-description">deciding between two outfits? wondering if something looks off?<br />send oro a photo and get a second opinion.</p>
        <ol className="product-demo-thread" role="list">
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right"><span className="sr-only">you: </span>thoughts on this fit?</SmsBubble>
          </li>
          <li className="product-demo-message product-demo-message--user">
            <SmsBubble tone="dark-purple" side="right">
              <span className="sr-only">you sent a photo: </span>
              <img src={outfitPhoto} alt="men’s outfit with a black leather jacket, washed grey cargo jeans, black knit beanie, and dark sneakers" loading="lazy" decoding="async" width="1024" height="1536" />
            </SmsBubble>
          </li>
          <li className="product-demo-message style-advice-demo-reply--continued">
            <SmsBubble><span className="sr-only">oro: </span>the worn leather and washed denim work really well together. the texture keeps the dark colours from feeling flat.</SmsBubble>
          </li>
          <li className="product-demo-message">
            <SmsBubble avatar={thinking}><span className="sr-only">oro: </span>i’d give the tee a small front tuck. it’s hiding your waistband, so showing a little of it would make your legs look longer and balance the roomy jacket.</SmsBubble>
          </li>
        </ol>
      </div>
    </section>
  )
}
