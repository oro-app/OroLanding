import { useRef, useState } from 'react'
import { Button, Text, TextField } from 'oro-kit'

function isWebUrl(value) {
  try {
    const url = new URL(value)
    return /^https?:\/\//i.test(value) && !url.username && !url.password
  } catch {
    return false
  }
}

export default function CreatorApplication() {
  const submissionId = useRef(null)
  const sending = useRef(false)
  const [status, setStatus] = useState('idle')

  async function submitApplication(event) {
    event.preventDefault()
    if (sending.current) return

    const form = event.currentTarget
    const payload = Object.fromEntries(
      Array.from(new FormData(form), ([name, value]) => [name, value.trim()]),
    )

    if (!payload.name || !payload.interest) {
      const field = form.elements.namedItem(payload.name ? 'interest' : 'name')
      field.setCustomValidity('Please enter an answer.')
      field.reportValidity()
      return
    }

    for (const name of ['videoUrl', 'profileUrl']) {
      if (payload[name] && !isWebUrl(payload[name])) {
        const field = form.elements.namedItem(name)
        field.setCustomValidity('Please enter a public link that starts with https:// or http://.')
        field.reportValidity()
        return
      }
    }

    sending.current = true
    setStatus('submitting')
    try {
      submissionId.current ??= crypto.randomUUID()
      const response = await fetch('/api/creator-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, submissionId: submissionId.current }),
      })

      if (response.ok && (await response.json())?.ok === true) {
        setStatus('sent')
      } else {
        setStatus(response.status === 400 ? 'invalid' : 'error')
      }
    } catch {
      setStatus('error')
    } finally {
      sending.current = false
    }
  }

  function clearValidation(event) {
    event.target.setCustomValidity?.('')
    if (status === 'invalid' || status === 'error') setStatus('idle')
  }

  return (
    <>
      {status !== 'sent' && (
        <form className="pilot-application" method="post" action="/api/creator-application" onSubmit={submitApplication} onInput={clearValidation}>
          <fieldset className="pilot-application-fields" disabled={status === 'submitting'}>
            <TextField label="What’s your name?" name="name" autoComplete="name" maxLength={120} required />
            <TextField label="What’s your email?" name="email" type="email" autoComplete="email" maxLength={254} required />
            <TextField
              label="Share a video you made that you’re proud of."
              hint="Use a link anyone can open."
              name="videoUrl"
              type="url"
              autoCapitalize="none"
              maxLength={2048}
              required
            />
            <div className="oro-field">
              <label className="oro-field__label" htmlFor="pilot-application-role">What did you do on the video? (optional)</label>
              <textarea className="oro-input" id="pilot-application-role" name="role" rows={3} maxLength={1000} />
            </div>
            <TextField
              label="Creator profile or portfolio (optional)"
              name="profileUrl"
              type="url"
              autoCapitalize="none"
              maxLength={2048}
            />
            <div className="oro-field">
              <label className="oro-field__label" htmlFor="pilot-application-interest">Why would you like to make videos with oro?</label>
              <textarea className="oro-input" id="pilot-application-interest" name="interest" rows={4} maxLength={1500} required />
            </div>
            <div className="oro-field">
              <label className="oro-field__label" htmlFor="pilot-application-availability">Can you make two short-form videos a week during the six-week pilot?</label>
              <select className="oro-input" id="pilot-application-availability" name="availability" defaultValue="" required>
                <option value="" disabled>Select an answer</option>
                <option value="yes">Yes</option>
                <option value="discuss">I’d like to discuss</option>
                <option value="no">No</option>
              </select>
            </div>
            <div hidden>
              <label htmlFor="pilot-application-website">Website</label>
              <input id="pilot-application-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
          </fieldset>
          <Button className="pilot-application-submit" type="submit" disabled={status === 'submitting'}>
            {status === 'submitting' ? 'Sending…' : 'Send application'}
          </Button>
          {status === 'invalid' && <Text className="pilot-application-error" role="alert">Please check your answers and try again.</Text>}
          {status === 'error' && <Text className="pilot-application-error" role="alert">We couldn’t send your application. Your answers are still here. Please try again.</Text>}
        </form>
      )}
      <div role="status">
        {status === 'sent' && <Text className="pilot-application-success">Thanks for applying. We’ve received your application.</Text>}
      </div>
    </>
  )
}
