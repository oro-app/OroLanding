import { Heading, Text } from 'oro-kit'
import ButtonArrow from '../ButtonArrow'
import mascot from '../../assets/mascot/oro_hi.webp'
import careerOutfit from '../../assets/poster-campaign/career.webp'
import datingOutfit from '../../assets/poster-campaign/dating.webp'

const openings = {
  general: { title: 'heard you were looking for my number.' },
  career: {
    title: 'got the interview?', copy: 'your résumé got you in the room. i’ll handle the outfit.',
    prompt: 'interview tomorrow. polished, but still me?', image: careerOutfit,
    alt: 'interview outfit with a charcoal blazer and trousers, ivory knit, oxblood loafers and bag, and silver accessories',
    advice: 'charcoal keeps it sharp. the oxblood shoes and bag add personality without distracting from you.',
  },
  dating: {
    title: 'first date. third outfit change?', copy: 'you got the date. i’ll handle the outfit.',
    prompt: 'first date. somewhere nice, but not too fancy.', image: datingOutfit,
    alt: 'date-night outfit with a brown suede jacket, ecru knit, dark jeans, leather loafers, and silver accessories',
    advice: 'suede, dark denim, a little silver. tuck the knit so the jacket hits cleanly at your waist.',
  },
}

export default function BetaWelcome({ campaign, enabled, href, titleRef }) {
  const opening = openings[campaign] || openings.general
  return <section className="beta-application beta-welcome" aria-labelledby="welcome-title" data-campaign={campaign}>
    <div className="beta-story-halo" aria-hidden="true" />
    <div className={`beta-form-panel beta-welcome-layout${opening.image ? ' beta-welcome-layout--example' : ''}`}>
      <div className="beta-welcome-content">
        <Heading ref={titleRef} tabIndex={-1} as="h1" variant="title" id="welcome-title">{opening.title}</Heading>
        {!opening.image && <div className="beta-welcome-portrait"><img className="beta-welcome-mascot" src={mascot} alt="oro waving hello" width="280" height="280" /></div>}
        {opening.copy && <Text className="beta-welcome-copy">{opening.copy}</Text>}
        <Text className={opening.image ? 'beta-welcome-intro' : 'beta-welcome-copy'}>your personal ai stylist,<br />right in your texts.</Text>
        {enabled
          ? <a className="oro-button oro-button--primary beta-welcome-cta" href={href}>want her number? <ButtonArrow /></a>
          : <button type="button" className="oro-button oro-button--primary beta-welcome-cta" disabled>want her number? <ButtonArrow /></button>}
        <Text className="beta-welcome-note" variant="support" muted>arriving october 8. get in line to meet her.</Text>
      </div>
      {opening.image && <div className="beta-welcome-demo" aria-label="a preview of styling with oro">
        <p className="beta-welcome-demo-label">a little preview</p>
        <p className="beta-welcome-message beta-welcome-message--you">{opening.prompt}</p>
        <img className="beta-welcome-outfit" src={opening.image} alt={opening.alt} width="1086" height="1448" fetchpriority="high" decoding="async" />
        <div className="beta-welcome-reply"><img src={mascot} alt="oro" width="40" height="40" /><p className="beta-welcome-message">{opening.advice}</p></div>
      </div>}
    </div>
  </section>
}
