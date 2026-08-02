import UiButton from '../base/UiButton'
import { trackCtaClick } from '../../lib/analytics'
import { USER_COUNT } from '../../lib/stats'

// Final CTA — a SHARED section (single component; theme-aware colour, same
// layout in both themes). Faithful to
// the handoff's sections/final-cta.jsx. "try oro" opens the existing
// WaitlistModal (consistent with every other try-oro CTA on the page).
export default function FinalCTA({ onTryOro }) {
  const handleTryOro = () => {
    trackCtaClick('try_oro_click', {
      location: 'bottom_of_page',
      destination: 'try_oro',
    })
    onTryOro?.()
  }

  return (
    <section id="try" className="fcta">
      <h2 className="fcta-title">
        start your <span className="fcta-em">morning</span> over.
      </h2>
      <p className="fcta-sub">your wardrobe is already full of good outfits.</p>
      <div className="fcta-actions">
        <UiButton label="try oro" prominence="hero" invertOnDark onPress={handleTryOro} />
        <p className="fcta-proof">join {USER_COUNT} people already getting dressed with oro.</p>
      </div>
    </section>
  )
}
