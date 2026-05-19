import { useTheme } from '../../context/ThemeContext'
import FakePhone from './FakePhone'

// How it works — faithful to the handoff (sections/how-it-works.jsx +
// sections/dark/how-it-works.jsx). Light and dark are structurally different
// (not a recolor): light has numbered 01/02/03 + hairline rules + a two-col
// header; dark drops the numbers for one big headline, larger phones, and
// slightly reworded step copy.

const STEPS_LIGHT = [
  { n: '01', title: 'add your closet.',    desc: 'snap a few fits. oro tags them in seconds.',          screen: 'home' },
  { n: '02', title: 'tell us the day.',    desc: 'two questions. where, how you feel.',                  screen: 'styleme' },
  { n: '03', title: 'wear what it picks.', desc: 'or tell oro to try again. either way — out the door.', screen: 'styled' },
]

const STEPS_DARK = [
  { title: 'add your closet.',    desc: 'snap a few fits. oro tags them.',   screen: 'home' },
  { title: 'tell us the day.',    desc: 'where you’re going. how you feel.', screen: 'styleme' },
  { title: 'wear what it picks.', desc: 'or ask for another. out the door.', screen: 'styled' },
]

function HowItWorksLight() {
  return (
    <section id="how" className="how how--light">
      <div className="how-l-head">
        <h2 className="how-l-title">
          three taps, every <span className="how-accent">morning</span>.
        </h2>
        <div className="how-l-lead">
          <p>one minute to set up. thirty seconds in the morning. one outfit, picked.</p>
        </div>
      </div>
      <div className="how-l-grid">
        {STEPS_LIGHT.map((s) => (
          <div className="how-l-step" key={s.n}>
            <div className="how-l-num">
              <span className="how-l-numfig">{s.n}</span>
              <span className="how-l-rule" aria-hidden="true" />
            </div>
            <div className="how-l-phone">
              <FakePhone width={150} screen={s.screen} />
            </div>
            <h3 className="how-l-steptitle">{s.title}</h3>
            <p className="how-l-stepdesc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function HowItWorksDark() {
  return (
    <section id="how" className="how how--dark">
      <h2 className="how-d-title">
        three taps, every <span className="how-em">morning</span>.
      </h2>
      <div className="how-d-grid">
        {STEPS_DARK.map((s) => (
          <div className="how-d-step" key={s.title}>
            <div className="how-d-phone">
              <FakePhone width={180} screen={s.screen} />
            </div>
            <h3 className="how-d-steptitle">{s.title}</h3>
            <p className="how-d-stepdesc">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function HowItWorks() {
  const { theme } = useTheme()
  return theme === 'dark' ? <HowItWorksDark /> : <HowItWorksLight />
}
