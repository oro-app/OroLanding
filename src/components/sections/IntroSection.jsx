import { useRef } from 'react'
import useScrollReveal from '../../lib/useScrollReveal'

export default function IntroSection() {
  const ref = useRef(null)
  const visible = useScrollReveal(ref, { threshold: 0.4, rootMargin: '0px 0px -8% 0px' })

  return (
    <section 
      id="intro" 
      ref={ref}
      className="relative w-screen h-screen overflow-hidden bg-black"
    >
      {/* Full-Bleed Wardrobe Image with fade-in */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1920&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.45)',
          opacity: 1,
          transform: 'scale(1)'
        }}
      />
      
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"
        style={{ opacity: 1 }}
      />

      {/* Centered Content */}
      <div className="relative h-full flex flex-col items-center justify-center text-center px-8">
        {/* Centered Logo with staggered entrance */}
        <img 
          src="/static/oro-logo.png" 
          alt="Oro" 
          className="h-48 md:h-64 lg:h-72 object-contain drop-shadow-2xl mb-8 transition-all duration-1000 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
            transitionDelay: '300ms'
          }}
        />

        {/* Subtitle with delayed entrance */}
        <p 
          className="text-white/80 text-base md:text-lg font-light tracking-widest uppercase transition-all duration-1000 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '600ms'
          }}
        >
          Your wardrobe, computed.
        </p>
      </div>

      {/* Scroll Indicator with delayed entrance */}
      <div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateX(-50%) ${visible ? 'translateY(0)' : 'translateY(20px)'}`,
          transitionDelay: '900ms'
        }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2 animate-bounce">
          <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </section>
  )
}
