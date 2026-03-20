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

      <footer className="border-t border-white/10 bg-black px-6 py-5 text-center text-xs uppercase tracking-[0.16em] text-white/70 sm:text-sm">
        oro 2026
      </footer>
    </div>
  )
}

export default App
