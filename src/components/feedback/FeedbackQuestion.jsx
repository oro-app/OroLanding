import { Button, Text } from 'oro-kit'

export function FeedbackWrittenAnswer({ questionId, field, label, value, update, error, required, labelledBy }) {
  const id = `${questionId}-${field}`
  const text = typeof value === 'string' ? value : ''
  return (
    <div className="oro-field">
      {label && <label className="oro-field__label" htmlFor={id}>{label}</label>}
      <textarea className="oro-input feedback-textarea" id={id} name={field} rows={4} value={text}
        required={required} aria-labelledby={labelledBy} aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`} autoComplete="off"
        autoCapitalize="sentences" autoCorrect="on" spellCheck
        onChange={(event) => update(event.target.value)} />
      <div className="feedback-field-footer">
        {error && <p id={`${id}-error`} className="oro-field__error">{error}</p>}
        <span id={`${id}-count`}>{[...text].length.toLocaleString()} / 2,000</span>
      </div>
    </div>
  )
}

export default function FeedbackQuestion({ question, answer = {}, update, error }) {
  const value = answer && typeof answer === 'object' ? answer : {}
  const multiple = question.type === 'multiple'
  const selected = multiple ? (Array.isArray(value.choices) ? value.choices : []) : [value.choice]
  const field = multiple ? 'choices' : 'choice'
  const write = (name, text) => update({ ...value, [name]: text })
  if (question.type === 'text') {
    return <FeedbackWrittenAnswer questionId={question.id} field="text" value={value.text} required={question.required}
      labelledBy="feedback-question-title" update={(text) => write('text', text)} error={error?.message} />
  }
  return (
    <fieldset className="feedback-question" aria-labelledby="feedback-question-title">
      <Text variant="support" muted>{multiple ? 'Select all that apply.' : 'Choose one.'}</Text>
      <div className="feedback-choices">
        {question.choices.map((option) => (
          <label className="feedback-option" key={option.id}>
            <input type={multiple ? 'checkbox' : 'radio'} name={question.id} value={option.id}
              checked={selected.includes(option.id)} required={!multiple && question.required}
              aria-invalid={error?.field === field ? true : undefined}
              aria-describedby={error?.field === field ? `${question.id}-choice-error` : undefined}
              onChange={() => update({ ...value, [field]: multiple
                ? selected.includes(option.id) ? selected.filter((id) => id !== option.id) : [...selected, option.id]
                : option.id })} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error?.field === field && <p className="oro-field__error" id={`${question.id}-choice-error`}>{error.message}</p>}
      {!question.required && selected.some(Boolean) && <Button type="button" variant="tertiary" onClick={() => update({})}>Clear answer</Button>}
      {selected.includes('other') && <FeedbackWrittenAnswer questionId={question.id} field="other_text" label="Please explain your Other answer"
        value={value.other_text} required update={(text) => write('other_text', text)} error={error?.field === 'other_text' && error.message} />}
      {question.allow_comment && <FeedbackWrittenAnswer questionId={question.id} field="comment" label="Add an explanation (optional)"
        value={value.comment} update={(text) => write('comment', text)} error={error?.field === 'comment' && error.message} />}
    </fieldset>
  )
}
