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
        style={{ background: 'var(--purple-deep)' }}
      >
        <div 
          className="absolute inset-x-0 top-0 h-px mx-auto"
          style={{
            maxWidth: '500px',
            background: 'linear-gradient(90deg, transparent, rgba(212,168,83,0.15), transparent)',
          }}
        />
        <p 
          className="mb-1"
          style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.35)' }}
        >
          © 2026 Oro
        </p>
        <p 
          style={{ fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.18)' }}
        >
          Built for personal style
        </p>
      </footer>
    </div>
  )
}

export default App
