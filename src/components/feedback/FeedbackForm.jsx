import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, Heading, Text } from 'oro-kit'
import { prepareFeedbackAnswers, pruneFeedbackDraft } from '../../lib/feedbackAnswers.js'
import FeedbackQuestion from './FeedbackQuestion.jsx'

const errorMessages = {
  invalid_answers: 'Please check your answers before sending again.',
  request_too_large: 'Your feedback is too long to send. Shorten some answers, then review it again.',
}

function FeedbackPrompt({ text }) {
  let index = 0
  const interval = Math.min(16, 500 / [...text].length)
  return <span aria-hidden="true">{text.split(' ').map((word, position) => (
    <Fragment key={position}>
      {position > 0 && ' '}
      <span className="feedback-prompt-word">{[...word].map((letter, offset) => (
        <span className="feedback-prompt-char" key={offset} style={{ '--feedback-letter-delay': `${index++ * interval}ms` }}>{letter}</span>
      ))}</span>
    </Fragment>
  ))}</span>
}

export default function FeedbackForm({ state, onChange, onSubmit }) {
  const { form, draft = {}, step } = state
  const questions = pruneFeedbackDraft(form.questions, draft).questions
  const reviewing = step === 'review'
  const index = Math.max(0, questions.findIndex((question) => question.id === step))
  const question = questions[index]
  const stepKey = reviewing ? 'review' : question?.id
  const title = reviewing ? 'Ready to send your feedback?' : question.prompt
  const [errors, setErrors] = useState({})
  const [focusRequest, setFocusRequest] = useState(0)
  const heading = useRef(null)
  const element = useRef(null)
  const focusError = useRef(false)
  const previousStep = useRef(stepKey)

  useLayoutEffect(() => {
    const changed = previousStep.current !== stepKey
    previousStep.current = stepKey
    if (!changed && !focusError.current) return
    const invalid = focusError.current && element.current?.querySelector('[aria-invalid="true"]')
    const target = invalid || heading.current
    target?.focus({ preventScroll: true })
    focusError.current = false
    heading.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [stepKey, focusRequest])

  useEffect(() => {
    const first = questions.find((item) => state.errors?.[item.id])
    if (!first) return
    setErrors(state.errors)
    focusError.current = true
    setFocusRequest((value) => value + 1)
    onChange(draft, first.id)
  }, [state.errors])

  function go(id) { setErrors({}); onChange(draft, id) }
  function update(value) {
    setErrors({})
    onChange({ ...draft, [question.id]: value }, question.id)
  }
  function advance(event) {
    event.preventDefault()
    const prepared = prepareFeedbackAnswers(form.questions, draft)
    const invalid = reviewing ? questions.find((item) => prepared.errors[item.id]) : prepared.errors[question.id] && question
    if (invalid) {
      focusError.current = true
      setFocusRequest((value) => value + 1)
      setErrors(prepared.errors)
      onChange(draft, invalid.id)
      return
    }
    if (reviewing) onSubmit()
    else if (index === questions.length - 1) {
      const earlier = questions.find((item) => prepared.errors[item.id])
      if (earlier) {
        focusError.current = true
        setFocusRequest((value) => value + 1)
        setErrors(prepared.errors)
        onChange(draft, earlier.id)
      } else go('review')
    } else go(questions[index + 1].id)
  }

  return (
    <form className="feedback-form" noValidate onSubmit={advance} ref={element} autoComplete="off">
      <div className="feedback-progress">
        <Text variant="support" muted>{reviewing ? 'One last look' : `Question ${index + 1} of ${questions.length}`}</Text>
        <div className="feedback-progress-track" role="progressbar" aria-label="Feedback progress"
          aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={reviewing ? questions.length : index}
          aria-valuetext={reviewing ? 'Ready to review' : `Question ${index + 1} of ${questions.length}`}>
          <span style={{ transform: `scaleX(${reviewing ? 1 : index / questions.length})` }} />
        </div>
      </div>
      <div className="feedback-step" key={stepKey}>
        <Heading as="h2" variant="section" id="feedback-question-title" tabIndex={-1} ref={heading} aria-label={title}>
          <FeedbackPrompt text={title} />
        </Heading>
        {state.notice === 'form_changed' && <Text role="status">This form has changed. Please answer the updated questions and review before sending.</Text>}
        {state.error && <Text role="alert">{errorMessages[state.error] || errorMessages.invalid_answers}</Text>}
        {reviewing ? <>
          <Text muted>You can edit your answers before sending. After sending, your feedback cannot be changed.</Text>
          <dl className="feedback-review">
            {questions.map((item, position) => {
              const answer = draft[item.id] || {}
              const selected = item.type === 'multiple' ? (Array.isArray(answer.choices) ? answer.choices : []) : [answer.choice]
              const labels = item.choices.filter((option) => selected.includes(option.id)).map((option) => option.label)
              const text = typeof answer.text === 'string' ? answer.text.trim() : ''
              const other = typeof answer.other_text === 'string' ? answer.other_text.trim() : ''
              const comment = typeof answer.comment === 'string' ? answer.comment.trim() : ''
              return <div className="feedback-review-item" key={item.id}>
                <dt>{item.prompt}</dt>
                <dd>
                  <p>{item.type === 'text' ? text || 'Not answered' : labels.join('; ') || 'Not answered'}</p>
                  {other && <p>Other: {other}</p>}
                  {comment && <p>Explanation: {comment}</p>}
                  <Button type="button" variant="tertiary" aria-label={`Edit answer ${position + 1}`} onClick={() => go(item.id)}>Edit</Button>
                </dd>
              </div>
            })}
          </dl>
        </> : <>
          <Text variant="support" muted>{question.required ? 'Required' : 'Optional'}</Text>
          {question.helper && <Text muted>{question.helper}</Text>}
          <FeedbackQuestion question={question} answer={draft[question.id]} update={update} error={errors[question.id]} />
        </>}
        <div className="feedback-actions">
          {(reviewing || index > 0) && <Button type="button" variant="secondary" onClick={() => go(questions[reviewing ? questions.length - 1 : index - 1].id)}>Back</Button>}
          <Button type="submit">{reviewing ? 'Send feedback' : index === questions.length - 1 ? 'Review answers' : 'Continue'}</Button>
        </div>
      </div>
    </form>
  )
}
