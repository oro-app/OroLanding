import { useEffect, useRef, useState } from 'react'
import { Button, Text, TextField } from 'oro-kit'

const INSTAGRAM_HANDLE = /^@?[A-Za-z0-9._]{1,30}$/
const MAX_TOTAL_LINK_LENGTH = 40000
const OTHER_REFERRAL = 'Other'
const OTHER_REFERRAL_PREFIX = `${OTHER_REFERRAL}: `
const REFERRAL_SOURCES = [
  'Instagram',
  'Friend or word of mouth',
  'Campus or student group',
  OTHER_REFERRAL,
]

function isWebUrl(value) {
  try {
    const url = new URL(value)
    return /^https?:\/\//i.test(value) && !/[\s\x00-\x1f\x7f]/.test(value) && !url.username && !url.password
  } catch {
    return false
  }
}

export default function CreatorApplication() {
  const submissionId = useRef(null)
  const sending = useRef(false)
  const nextLinkId = useRef(1)
  const linkToFocus = useRef(null)
  const addLinkButton = useRef(null)
  const [status, setStatus] = useState('idle')
  const [linkIds, setLinkIds] = useState([0])
  const [referralSource, setReferralSource] = useState('')

  useEffect(() => {
    if (linkToFocus.current === null) return
    document.getElementById(`pilot-application-link-${linkToFocus.current}`)?.focus()
    linkToFocus.current = null
  }, [linkIds])

  function addLink() {
    const id = nextLinkId.current++
    linkToFocus.current = id
    setLinkIds((ids) => [...ids, id])
  }

  function removeLink(id) {
    setLinkIds((ids) => ids.filter((linkId) => linkId !== id))
    setStatus('idle')
    addLinkButton.current?.focus()
  }

  async function submitApplication(event) {
    event.preventDefault()
    if (sending.current) return

    const form = event.currentTarget
    const fields = new FormData(form)
    fields.delete('links')
    const { referralOther, ...payload } = Object.fromEntries(Array.from(fields, ([name, value]) => [name, value.trim()]))

    if (!payload.name) {
      const field = form.elements.namedItem('name')
      field.setCustomValidity('Please enter an answer.')
      field.reportValidity()
      return
    }

    if (!INSTAGRAM_HANDLE.test(payload.instagramHandle)) {
      const field = form.elements.namedItem('instagramHandle')
      field.setCustomValidity('Enter your Instagram handle, with or without the @.')
      field.reportValidity()
      return
    }

    if (payload.referralSource === OTHER_REFERRAL) {
      if (!referralOther) {
        const field = form.elements.namedItem('referralOther')
        field.setCustomValidity('Please specify how you heard about this opportunity.')
        field.reportValidity()
        return
      }
      payload.referralSource = `${OTHER_REFERRAL_PREFIX}${referralOther}`
    }

    const links = []
    for (const field of form.querySelectorAll('input[name="links"]')) {
      const link = field.value.trim()
      if (!link) continue
      if (!isWebUrl(link)) {
        field.setCustomValidity('Please enter a public link that starts with https:// or http://.')
        field.reportValidity()
        return
      }
      links.push(link)
    }
    if (links.join('\n').length > MAX_TOTAL_LINK_LENGTH) {
      setStatus('linksTooLong')
      return
    }

    sending.current = true
    setStatus('submitting')
    try {
      submissionId.current ??= crypto.randomUUID()
      const response = await fetch('/api/creator-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, links, submissionId: submissionId.current }),
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
    if (status === 'invalid' || status === 'error' || status === 'linksTooLong') setStatus('idle')
  }

  return (
    <>
      {status !== 'sent' && (
        <form className="pilot-application" method="post" action="/api/creator-application" onSubmit={submitApplication} onInput={clearValidation}>
          <fieldset className="pilot-application-fields" disabled={status === 'submitting'}>
            <TextField label="What’s your name?" name="name" autoComplete="name" maxLength={120} required />
            <TextField label="What’s your email?" name="email" type="email" autoComplete="email" maxLength={254} required />
            <TextField
              label="What’s your Instagram handle?"
              name="instagramHandle"
              placeholder="@yourhandle"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={31}
              required
            />
            <div className="oro-field">
              <label className="oro-field__label" htmlFor="pilot-application-referral">How did you hear about this opportunity?</label>
              <select
                className="oro-input"
                id="pilot-application-referral"
                name="referralSource"
                value={referralSource}
                onChange={(event) => setReferralSource(event.target.value)}
                required
              >
                <option value="" disabled>Select an option</option>
                {REFERRAL_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
              </select>
            </div>
            {referralSource === OTHER_REFERRAL && (
              <TextField label="Please specify" name="referralOther" maxLength={500 - OTHER_REFERRAL_PREFIX.length} required />
            )}
            <fieldset className="pilot-application-links">
              <legend className="oro-field__label">Portfolio or other links (optional)</legend>
              {linkIds.map((id, index) => (
                <div className="pilot-application-link" key={id}>
                  <TextField
                    id={`pilot-application-link-${id}`}
                    label={`Link ${index + 1}`}
                    name="links"
                    type="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    maxLength={2048}
                  />
                  <Button type="button" variant="secondary" aria-label={`Remove link ${index + 1}`} onClick={() => removeLink(id)}>Remove</Button>
                </div>
              ))}
              <Button ref={addLinkButton} type="button" variant="secondary" onClick={addLink}>Add another link</Button>
            </fieldset>
            <div className="oro-field">
              <label className="oro-field__label" htmlFor="pilot-application-notes">Anything else you’d like to share? (optional)</label>
              <textarea className="oro-input" id="pilot-application-notes" name="notes" rows={4} maxLength={1500} />
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
          {status === 'linksTooLong' && <Text className="pilot-application-error" role="alert">Your links are too long to send together. Please shorten or remove some and try again.</Text>}
          {status === 'error' && <Text className="pilot-application-error" role="alert">We couldn’t send your application. Your answers are still here. Please try again.</Text>}
        </form>
      )}
      <div role="status">
        {status === 'sent' && <Text className="pilot-application-success">Thanks for applying. We’ve received your application.</Text>}
      </div>
    </>
  )
}
