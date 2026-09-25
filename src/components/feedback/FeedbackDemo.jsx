import { useEffect, useRef, useState } from 'react'
import { Button, Heading, Text } from 'oro-kit'
import { prepareFeedbackAnswers, pruneFeedbackDraft } from '../../lib/feedbackAnswers.js'
import FeedbackForm from './FeedbackForm.jsx'
import demoForms from './demoForms.json'

export default function FeedbackDemo({ kind }) {
  const surveyKind = ['task', 'task-no-outfit'].includes(kind) ? 'task' : kind === 'final' ? 'final' : 'daily'
  const form = { survey_kind: surveyKind, survey_version: 1,
    questions: demoForms[surveyKind].filter((question) => kind !== 'task-no-outfit' || question.id !== 'R9') }
  const [state, setState] = useState({ status: 'open', form, draft: {}, step: null })
  const completion = useRef(null)
  useEffect(() => { if (state.status === 'done') completion.current?.focus() }, [state.status])
  const update = (draft, step) => setState({ status: 'open', form, draft: pruneFeedbackDraft(form.questions, draft).answers, step })
  const submit = () => {
    const prepared = prepareFeedbackAnswers(form.questions, state.draft)
    if (Object.keys(prepared.errors).length) setState({ ...state, errors: prepared.errors })
    else setState({ status: 'done' })
  }
  return (
    <section className="feedback-page ph-no-capture" data-private="true" aria-labelledby="feedback-title">
      <a className="halo-logo-link" href="/" aria-label="Oro home"><img className="halo-logo" src="/static/oro-logo.png" alt="Oro" width="80" height="32" /></a>
      <Heading as="h1" variant="title" id="feedback-title">Feedback demo</Heading>
      <Text role="status">Try the forms with sample context. Nothing you enter here is saved or sent.</Text>
      <nav className="feedback-demo-nav" aria-label="Demo forms">
        {[['daily', 'Daily'], ['task', 'Task with outfit'], ['task-no-outfit', 'Task without outfit'], ['final', 'End of beta']].map(([value, label]) =>
          <a key={value} href={`?demo=${value}`} aria-current={(kind || 'daily') === value ? 'page' : undefined}>{label}</a>)}
      </nav>
      <Text muted>{surveyKind === 'daily' ? 'daily feedback · 2026-09-24 (America/Toronto)' : surveyKind === 'task' ? 'task feedback · Your Oro task' : 'final feedback · Oro beta'}</Text>
      {state.status === 'done' ? <>
        <Heading as="h2" variant="section" tabIndex={-1} ref={completion}>Demo complete</Heading>
        <Text>No response was sent. A real invitation will save feedback after you choose Send feedback.</Text>
        <Button type="button" onClick={() => update({}, null)}>Try again</Button>
      </> : <FeedbackForm state={state} onChange={update} onSubmit={submit} demo />}
    </section>
  )
}
