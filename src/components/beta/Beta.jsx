import { useEffect, useState } from 'react'
import { HomeHeader } from '../home/HomeChrome'
import BetaWelcome from './BetaWelcome'
import { REFERRAL_CODE } from '../../lib/betaContract'
import './Beta.css'

export default function Beta({ campaign = 'general' }) {
  const [inviteUrl, setInviteUrl] = useState('')

  useEffect(() => {
    document.title = 'meet oro - your personal ai stylist'
    const url = new URL(window.location.href)
    const ref = url.searchParams.get('ref') || ''
    if (REFERRAL_CODE.test(ref)) setInviteUrl(`${url.origin}/invite?ref=${ref}`)
    if (!url.searchParams.has('step') && !url.hash) return
    url.searchParams.delete('step')
    url.hash = ''
    window.history.replaceState(null, '', `${url.pathname}${url.search}`)
  }, [])

  return <div className="beta-page beta-page--welcome">
    <HomeHeader />
    <BetaWelcome campaign={campaign} inviteUrl={inviteUrl} />
  </div>
}
