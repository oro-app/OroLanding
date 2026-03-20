import IntroSection from './components/sections/IntroSection'
import AboutSection from './components/sections/AboutSection'
import AppMockups from './components/sections/AppMockups'
import WaitlistSection from './components/sections/WaitlistSection'

function App() {
  return (
    <div className="bg-black text-white min-h-screen">
      <IntroSection />
      <AboutSection />
      <AppMockups />
      <WaitlistSection />

      <footer className="border-t border-white/10 bg-black px-6 py-8 text-center text-[0.65rem] uppercase tracking-[0.2em] text-white/50">
        © 2026 Oro. All rights reserved.
      </footer>
    </div>
  )
}

export default App
