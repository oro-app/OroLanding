import IntroSection from './components/sections/IntroSection'
import AboutSection from './components/sections/AboutSection'
import AppMockups from './components/sections/AppMockups'
import WaitlistSection from './components/sections/WaitlistSection'

function App() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg-dark)' }}>
      <IntroSection />
      <AboutSection />
      <AppMockups />
      <WaitlistSection />

      <footer 
        className="relative px-6 py-16 text-center"
        style={{ background: 'var(--bg-dark)' }}
      >
        <div 
          className="absolute inset-x-0 top-0 h-px mx-auto"
          style={{
            maxWidth: '500px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          }}
        />
        <p 
          className="text-white/25 mb-1"
          style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}
        >
          © 2026 Oro
        </p>
        <p 
          className="text-white/12"
          style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}
        >
          Built for personal style
        </p>
      </footer>
    </div>
  )
}

export default App
