import { useEffect, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { captureFeedbackSession, initialFeedbackStatus } from '../../lib/feedbackSession.js'
import './Feedback.css'

const messages = {
  opening: 'Opening your invitation…',
  missing: 'Open your personal feedback link from Oro to continue.',
  unavailable: 'Feedback is not available yet. Please check back using your invitation link.',
  storage: 'Your browser could not keep this invitation. Allow browser storage, then reopen your personal link. You can also email us for help.',
}

export default function Feedback() {
  const [status, setStatus] = useState('opening')
  useEffect(() => {
    setStatus(location.hash && location.hash !== '#main' ? captureFeedbackSession() : initialFeedbackStatus)
    const refresh = () => setStatus(captureFeedbackSession())
    window.addEventListener('hashchange', refresh)
    return () => window.removeEventListener('hashchange', refresh)
  }, [])
  return (
    <section className="feedback-page ph-no-capture" data-private="true" aria-labelledby="feedback-title">
      <a className="halo-logo-link" href="/" aria-label="Oro home"><img className="halo-logo" src="/static/oro-logo.png" alt="Oro" width="80" height="32" /></a>
      <Heading as="h1" variant="title" id="feedback-title">Beta feedback</Heading>
      <Text muted role="status">{messages[status]}</Text>
      <a className="oro-button oro-button--secondary" href="mailto:sunny@buildingoro.ca">Email us</a>
    </section>
  )
}
