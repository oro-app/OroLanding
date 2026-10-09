import { useEffect } from 'react'
import { HomeHeader } from '../home/HomeChrome'
import BetaWelcome from './BetaWelcome'
import './Beta.css'

export default function Beta({ campaign = 'general' }) {
  useEffect(() => {
    document.title = 'meet oro - your personal ai stylist'
    const url = new URL(window.location.href)
    if (!url.searchParams.has('step') && !url.hash) return
    url.searchParams.delete('step')
    url.hash = ''
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }, [])

  return <div className="beta-page beta-page--welcome">
    <HomeHeader />
    <BetaWelcome campaign={campaign} />
  </div>
}
