import { HomeFooter, HomeHeader } from '../home/HomeChrome'
import BetaWelcome from './BetaWelcome'
import './Beta.css'

export default function Beta({ campaign = 'general' }) {
  return (
    <div className="beta-page beta-page--welcome">
      <HomeHeader />
      <BetaWelcome campaign={campaign} />
      <HomeFooter />
    </div>
  )
}
