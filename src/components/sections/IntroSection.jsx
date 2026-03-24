import { useState, useEffect, useRef } from 'react'

export default function IntroSection() {
  const [loaded, setLoaded] = useState(false)
  const bgRef = useRef(null)
  const contentRef = useRef(null)
  const scrollIndicatorRef = useRef(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const bg = bgRef.current
    const content = contentRef.current
    const indicator = scrollIndicatorRef.current

    const update = () => {
      const y = window.scrollY
      bg.style.transform = `translate3d(0, ${y * 0.4}px, 0) scale(1.15)`
      content.style.transform = `translate3d(0, ${y * -0.15}px, 0)`
      indicator.style.opacity = String(Math.max(0.4 - y * 0.004, 0))
    }

    const onScroll = () => requestAnimationFrame(update)

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section 
      id="intro" 
      className="relative w-screen h-screen overflow-hidden"
      style={{ background: 'var(--bg-dark)' }}
    >
      <div 
        ref={bgRef}
        className="absolute inset-0 will-change-transform"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3) saturate(0.7)',
          transform: 'translate3d(0, 0, 0) scale(1.15)',
        }}
      />
      
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

      <div 
        ref={contentRef}
        className="relative h-full flex flex-col items-center justify-center text-center px-8 will-change-transform"
      >
        <img 
          src="/static/oro-logo.png" 
          alt="Oro" 
          className="h-44 md:h-56 lg:h-64 object-contain mb-10"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0) scale(1)' : 'translateY(25px) scale(0.97)',
            transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
          }}
        />

        <p 
          className="text-white/50 text-sm md:text-base uppercase"
          style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif',
            letterSpacing: '0.35em',
            fontWeight: 300,
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(15px)',
            transition: 'opacity 1.2s ease-out 0.3s, transform 1.2s ease-out 0.3s',
          }}
        >
          Your wardrobe, computed.
        </p>
      </div>

      <div 
        ref={scrollIndicatorRef}
        className="absolute bottom-10 left-1/2 flex flex-col items-center gap-3"
        style={{
          opacity: loaded ? 0.4 : 0,
          transform: 'translateX(-50%)',
          transition: loaded ? 'none' : 'opacity 1.2s ease-out 0.8s',
        }}
      >
        <span 
          className="text-white/30 uppercase"
          style={{ fontSize: '9px', letterSpacing: '0.3em', fontWeight: 400 }}
        >
          Scroll
        </span>
        <div className="w-px h-7 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
