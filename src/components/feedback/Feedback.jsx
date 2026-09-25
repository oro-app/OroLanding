import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Button, Heading, Text } from 'oro-kit'
import { captureFeedbackSession, readFeedbackSession } from '../../lib/feedbackSession.js'
import { createFeedbackFlow } from '../../lib/feedbackFlow.js'
import FeedbackForm from './FeedbackForm.jsx'
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
  sending: 'Sending your feedback…',
  reconciling: 'We’re checking whether your feedback arrived. Your answers are locked while we confirm.',
  retry: 'We haven’t confirmed your feedback yet. Retry to send the same response safely.',
  conflict: 'We couldn’t reconcile this response. Reopen your personal invitation or email us for help. Your answers remain locked.',
}
const FeedbackDemo = lazy(() => import('./FeedbackDemo.jsx'))

export default function Feedback() {
  const [state, setState] = useState({ status: 'opening' })
  const [demo, setDemo] = useState(null)
  const flow = useRef(null)
  const statusMessage = useRef(null)
  useEffect(() => {
    const demoKind = new URLSearchParams(location.search).get('demo')
    if (demoKind !== null) { setDemo(demoKind || 'daily'); return }
    let active = true
    const pause = () => flow.current?.pause()
    const resume = () => { if (active) document.hidden ? pause() : flow.current?.resume() }
    const open = () => {
      flow.current?.stop()
      const status = captureFeedbackSession()
      setState({ status })
      if (status !== 'unavailable') return
      try {
        flow.current = createFeedbackFlow(readFeedbackSession().token, setState)
        setState({ status: 'opening' })
        queueMicrotask(resume)
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
      active = false
      flow.current?.stop()
      window.removeEventListener('hashchange', refresh)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('pageshow', resume)
    }
  }, [])
  useEffect(() => {
    if (['submitted', 'retry', 'conflict'].includes(state.status)) statusMessage.current?.focus()
  }, [state.status])
  if (demo !== null) return <Suspense fallback={<p role="status">Opening the demo…</p>}><FeedbackDemo kind={demo} /></Suspense>
  const context = state.form?.context
  const label = context && ({ task: context.task_label, daily: context.local_date, final: context.beta_label })[state.form.survey_kind]
  const status = state.status === 'missing_token' ? 'missing' : state.status
  return (
    <section className="feedback-page ph-no-capture" data-private="true" aria-labelledby="feedback-title">
      <a className="halo-logo-link" href="/" aria-label="Oro home"><img className="halo-logo" src="/static/oro-logo.png" alt="Oro" width="80" height="32" /></a>
      <Heading as="h1" variant="title" id="feedback-title">Beta feedback</Heading>
      {status === 'open' && <Text>{state.form.survey_kind} feedback · {label}{state.form.survey_kind === 'daily' && ` (${context.timezone})`}</Text>}
      {status === 'open'
        ? <FeedbackForm state={state} onChange={(draft, step) => flow.current?.update(draft, step)} onSubmit={() => flow.current?.submit()} />
        : <Text muted role="status" tabIndex={-1} ref={statusMessage}>{messages[status] || messages.unavailable}</Text>}
      {status === 'retry' && <Button onClick={() => flow.current?.retry()}>Retry sending</Button>}
      {['feedback_disabled', 'conflict'].includes(status) && <Button variant="secondary" onClick={() => flow.current?.resume()}>Check again</Button>}
      <a className="oro-button oro-button--secondary" href={status === 'missing' ? '/' : 'mailto:sunny@buildingoro.ca'}>
        {status === 'missing' ? 'Back to Oro' : 'Email us'}
      </a>
    </section>
  )
}
