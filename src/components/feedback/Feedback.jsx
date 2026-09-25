import { useEffect, useState } from 'react'
import { Heading, Text } from 'oro-kit'
import { captureFeedbackSession, readFeedbackSession } from '../../lib/feedbackSession.js'
import { createFeedbackReader } from '../../lib/feedbackReader.js'
import './Feedback.css'

const messages = {
  opening: 'Opening your invitation…',
  missing: 'Open your personal feedback link from Oro to continue.',
  unavailable: 'Feedback is not available yet. Please check back using your invitation link.',
  storage: 'Your browser could not keep this invitation. Allow browser storage, then reopen your personal link. You can also email us for help.',
  invalid_invitation: 'This invitation is no longer valid. Email us for help getting a new link.',
  invitation_expired: 'This invitation has expired. Email us for a new link.',
  saving: 'Your feedback is still saving. We’ll check again for confirmation.',
  submitted: 'Thank you. Your feedback is saved.',
  rate_limited: 'Please wait before checking again. We’ll retry automatically.',
  temporarily_unavailable: 'We couldn’t check your invitation. We’ll retry automatically.',
}

export default function Feedback() {
  const [state, setState] = useState({ status: 'opening' })
  useEffect(() => {
    let reader
    const pause = () => reader?.pause()
    const resume = () => document.hidden ? pause() : reader?.resume()
    const open = () => {
      reader?.stop()
      const status = captureFeedbackSession()
      setState({ status })
      if (status !== 'unavailable') return
      try {
        reader = createFeedbackReader(readFeedbackSession().token, setState)
        setState({ status: 'opening' })
        resume()
      } catch {
        setState({ status: 'storage' })
      }
    }
    const refresh = () => {
      if (location.hash && location.hash !== '#main') open()
    }
    open()
    window.addEventListener('hashchange', refresh)
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('pagehide', pause)
    window.addEventListener('pageshow', resume)
    return () => {
      reader?.stop()
      window.removeEventListener('hashchange', refresh)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('pageshow', resume)
    }
  }, [])
  const context = state.form?.context
  const label = context && ({ task: context.task_label, daily: context.local_date, final: context.beta_label })[state.form.survey_kind]
  const status = state.status === 'missing_token' ? 'missing' : state.status
  return (
    <section className="feedback-page ph-no-capture" data-private="true" aria-labelledby="feedback-title">
      <a className="halo-logo-link" href="/" aria-label="Oro home"><img className="halo-logo" src="/static/oro-logo.png" alt="Oro" width="80" height="32" /></a>
      <Heading as="h1" variant="title" id="feedback-title">Beta feedback</Heading>
      {status === 'open' && <Text>{state.form.survey_kind} feedback · {label}{state.form.survey_kind === 'daily' && ` (${context.timezone})`}</Text>}
      <Text muted role="status">{messages[status] || messages.unavailable}</Text>
      <a className="oro-button oro-button--secondary" href="mailto:sunny@buildingoro.ca">Email us</a>
    </section>
  )
}
