const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const INSTAGRAM_HANDLE = /^@?[A-Za-z0-9._]{1,30}$/
const AVAILABILITY = new Set(['yes', 'discuss', 'no'])
const CONTACT_FIELDS = { name: 120, email: 254 }
const CREATOR_FIELDS = { instagramHandle: 31, referralSource: 500, notes: 1500 }
const LEGACY_FIELDS = {
  videoUrl: 2048,
  profileUrl: 2048,
  role: 1000,
  interest: 1500,
}
const MAX_LINK_LENGTH = 2048
const MAX_LINKS_LENGTH = 40000
const UNAVAILABLE = 'Applications are temporarily unavailable. Please try again.'

function isWebLink(value) {
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && /^https?:\/\//i.test(value)
  } catch {
    return false
  }
}

function readFields(body, limits, required) {
  const fields = {}
  for (const [field, maxLength] of Object.entries(limits)) {
    const rawValue = body[field] ?? ''
    if (typeof rawValue !== 'string') return null
    const value = rawValue.trim()
    if (value.length > maxLength) return null
    fields[field] = value
  }
  return required.every((field) => fields[field]) ? fields : null
}

function normalizeLinks(value = []) {
  if (!Array.isArray(value)) return null
  const links = []
  let joinedLength = 0
  for (const rawLink of value) {
    if (typeof rawLink !== 'string') return null
    const link = rawLink.trim()
    if (!link || link.length > MAX_LINK_LENGTH || /[\s\x00-\x1f\x7f]/.test(link) || !isWebLink(link)) return null
    joinedLength += link.length + (links.length ? 1 : 0)
    if (joinedLength > MAX_LINKS_LENGTH) return null
    links.push(link)
  }
  return links
}

function normalizeApplication(body) {
  const { submissionId, availability } = body
  if (typeof submissionId !== 'string' || !UUID_V4.test(submissionId)) return null

  const contact = readFields(body, CONTACT_FIELDS, ['name', 'email'])
  if (!contact || !EMAIL.test(contact.email)) return null
  const application = { submissionId: submissionId.toLowerCase(), ...contact }

  if (Object.hasOwn(body, 'links') || Object.keys(CREATOR_FIELDS).some((field) => Object.hasOwn(body, field))) {
    const fields = readFields(body, CREATOR_FIELDS, ['instagramHandle', 'referralSource'])
    const links = normalizeLinks(body.links)
    if (!fields || !INSTAGRAM_HANDLE.test(fields.instagramHandle) || !links) return null
    const instagramHandle = `@${fields.instagramHandle.replace(/^@/, '')}`
    return { ...application, ...fields, instagramHandle, links }
  }

  const fields = readFields(body, LEGACY_FIELDS, ['videoUrl', 'interest'])
  if (!fields || !AVAILABILITY.has(availability) || !isWebLink(fields.videoUrl) || (fields.profileUrl && !isWebLink(fields.profileUrl))) return null
  return { ...application, ...fields, availability }
}

function getScriptUrl(value) {
  const url = new URL(value)
  const execPath = /^\/(?:macros|a\/macros\/[a-z0-9.-]+)\/s\/[A-Za-z0-9_-]+\/exec$/i
  if (url.origin !== 'https://script.google.com' || url.username || url.password || url.search || url.hash || !execPath.test(url.pathname)) {
    throw new Error('Invalid script configuration')
  }
  return url
}

async function submitApplication(scriptUrl, secret, application) {
  const signal = AbortSignal.timeout(10000)
  let response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret, ...application }),
    redirect: 'manual',
    signal,
  })

  if ([301, 302, 303].includes(response.status)) {
    const resultUrl = new URL(response.headers.get('location'))
    if (resultUrl.origin !== 'https://script.googleusercontent.com' || resultUrl.pathname !== '/macros/echo' || resultUrl.username || resultUrl.password) {
      return false
    }
    response = await fetch(resultUrl, { redirect: 'error', signal })
  }

  return response.ok && (await response.json())?.ok === true
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body
  if (!body || typeof body !== 'object' || Array.isArray(body) || (body.website != null && typeof body.website !== 'string')) {
    return res.status(400).json({ error: 'Check your answers and try again.' })
  }
  if (body.website?.trim()) return res.status(201).json({ ok: true })

  const application = normalizeApplication(body)
  if (!application) return res.status(400).json({ error: 'Check your answers and try again.' })

  try {
    const secret = process.env.CREATOR_APPLICATION_SECRET
    const scriptUrl = getScriptUrl(process.env.CREATOR_APPLICATION_SCRIPT_URL)
    if (secret && await submitApplication(scriptUrl, secret, application)) return res.status(201).json({ ok: true })
  } catch {
    return res.status(503).json({ error: UNAVAILABLE })
  }
  return res.status(503).json({ error: UNAVAILABLE })
}
