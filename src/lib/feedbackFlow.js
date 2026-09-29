import { MAX_FEEDBACK_BYTES, saveFeedback } from './feedbackApi.js'
import { prepareFeedbackAnswers, pruneFeedbackDraft } from './feedbackAnswers.js'
import { clearFeedbackDraft, readFeedbackDraft, writeFeedbackDraft } from './feedbackDraft.js'
import { createFeedbackReader } from './feedbackReader.js'
import { readFeedbackSession, writeFeedbackSession } from './feedbackSession.js'

const terminal = ['submitted', 'invalid_invitation', 'invitation_expired', 'missing_token']

export function createFeedbackFlow(token, onChange) {
  let state = { status: 'opening' }
  let form, formKey, draft = {}, step, request
  let stopped = false, visible = false
  const emit = (next) => { if (!stopped) { state = next; onChange(next) } }
  const session = () => {
    const value = readFeedbackSession()
    return value?.token === token ? value : null
  }
  const reader = createFeedbackReader(token, receive)

  function storageFailure() {
    reader.stop()
    request?.abort()
    emit({ status: 'storage' })
    stopped = true
  }
  function receive(next) {
    if (stopped) return
    if (terminal.includes(next.status) || next.status === 'storage') {
      if (next.status === 'submitted') clearFeedbackDraft(`${next.form.invitation_id}:${next.form.survey_version}`)
      emit(next)
      return
    }
    const current = session()
    if (!current) return stop()
    if (next.status === 'saving') {
      writeFeedbackSession({ token, nextCheckAt: current.nextCheckAt, acceptedSubmissionId: next.form.submission_id })
      emit(next)
      return
    }
    if (next.status !== 'open') { emit(next); return }
    form = next.form
    if (current.attempt || current.acceptedSubmissionId) {
      const retry = current.attempt?.phase === 'uncertain' && current.attempt.invitationId === form.invitation_id
      emit({ status: retry ? 'retry' : 'conflict', form })
      return
    }
    formKey = `${form.invitation_id}:${form.survey_version}`
    const changed = Boolean(current.formKey && current.formKey !== formKey) || current.formChanged
    const cached = changed ? null : readFeedbackDraft(formKey)
    draft = pruneFeedbackDraft(form.questions, cached?.draft).answers
    step = changed ? null : cached?.step
    writeFeedbackSession({ ...current, formKey, formChanged: false })
    emit({ status: 'open', form, draft, step, notice: changed ? 'form_changed' : undefined })
  }
  function update(nextDraft, nextStep) {
    if (stopped || state.status !== 'open' || request) return
    try {
      const current = session()
      if (!current || current.attempt || current.acceptedSubmissionId) return
      const answers = pruneFeedbackDraft(form.questions, nextDraft).answers
      draft = answers
      step = nextStep
      writeFeedbackDraft(formKey, { draft, step })
      emit({ ...state, draft: answers, step, errors: {}, error: undefined })
    } catch { storageFailure() }
  }
  function resumeReader() {
    if (!stopped && visible && !request) reader.resume()
  }
  async function send(attempt) {
    reader.pause()
    const active = new AbortController()
    request = active
    emit({ status: 'sending' })
    const result = await saveFeedback(token, attempt.id, attempt.body, { signal: active.signal })
    if (stopped || request !== active) return
    request = null
    try {
      const current = session()
      if (!current || current.attempt?.id !== attempt.id) return stop()
      if (result.ok && result.status === 'submitted') {
        clearFeedbackDraft(formKey)
        writeFeedbackSession(null)
        reader.stop()
        emit({ status: 'submitted', receipt: result.receipt })
        return
      }
      if (result.ok) {
        writeFeedbackSession({ token, acceptedSubmissionId: attempt.id, nextCheckAt: Date.now() + 15000 })
        emit({ status: 'saving' })
      } else if (terminal.includes(result.code)) {
        writeFeedbackSession(null)
        reader.stop()
        emit({ status: result.code })
        return
      } else if (['invalid_answers', 'request_too_large'].includes(result.code)) {
        writeFeedbackSession({ ...current, attempt: undefined })
        const errors = {}
        for (const id of result.questionIds ?? []) {
          const question = form?.questions.find((item) => item.id === id)
          if (question) errors[id] = { field: question.type === 'text' ? 'text' : question.type === 'multiple' ? 'choices' : 'choice', message: 'Please check this answer.' }
        }
        emit({ status: 'open', form, draft, step, errors, error: result.code })
        return
      } else if (result.code === 'survey_version_mismatch') {
        writeFeedbackSession({ ...current, attempt: undefined, formChanged: true, nextCheckAt: Date.now() + 15000 })
        emit({ status: 'reconciling', notice: 'form_changed' })
      } else {
        const conflict = ['already_submitted', 'submission_id_conflict'].includes(result.code)
        const delay = conflict ? 15 : Math.max(15, result.retryAfter)
        writeFeedbackSession({ ...current, attempt: { ...attempt, phase: conflict ? result.code : 'uncertain' }, nextCheckAt: Date.now() + delay * 1000 })
        emit({ status: 'reconciling' })
      }
      resumeReader()
    } catch { storageFailure() }
  }
  function submit() {
    if (stopped || state.status !== 'open' || request) return
    try {
      const current = session()
      if (!current || current.attempt || current.acceptedSubmissionId) return
      const prepared = prepareFeedbackAnswers(form.questions, draft)
      if (Object.keys(prepared.errors).length) { emit({ ...state, errors: prepared.errors }); return }
      const body = JSON.stringify({ survey_version: form.survey_version, answers: prepared.answers })
      if (new TextEncoder().encode(body).byteLength > MAX_FEEDBACK_BYTES) { emit({ ...state, error: 'request_too_large' }); return }
      const attempt = { id: crypto.randomUUID(), invitationId: form.invitation_id, body, phase: 'uncertain' }
      writeFeedbackSession({ ...current, attempt })
      void send(attempt)
    } catch { storageFailure() }
  }
  function retry() {
    if (stopped || state.status !== 'retry' || request) return
    try {
      const current = session()
      if (current?.attempt?.phase !== 'uncertain') return
      void send(current.attempt)
    } catch { storageFailure() }
  }
  function pause() {
    visible = false
    reader.pause()
    request?.abort()
  }
  function stop() {
    stopped = true
    pause()
    reader.stop()
  }
  return {
    update, submit, retry, pause, stop,
    resume() { visible = true; resumeReader() },
  }
}
