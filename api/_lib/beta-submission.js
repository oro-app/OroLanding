import { createHash } from 'node:crypto'
import { MAX_BODY_BYTES, UUID4, canonicalPayload, validateSubmission } from '../../src/lib/betaContract.js'

export function readConfig(env) {
  const url = env.BETA_APPS_SCRIPT_URL || ''
  const secret = env.BETA_SUBMISSION_SECRET || ''
  const cohort = env.BETA_COHORT || ''
  const rateLimitId = env.BETA_RATE_LIMIT_ID || ''
  const host = env.VERCEL_URL || ''
  const origins = (env.BETA_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean)
  if (host) origins.push(`https://${host}`)
  const enabled = env.BETA_SIGNUP_ENABLED === 'true' && env.VERCEL === '1' && env.NODE_ENV === 'production'
    && /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url)
    && secret.length >= 32 && /^[a-zA-Z0-9_-]{1,80}$/.test(cohort)
    && /^[a-zA-Z0-9_-]{1,100}$/.test(rateLimitId) && /^[a-zA-Z0-9.-]+\.vercel\.app$/.test(host)
    && origins.every((origin) => { try { return new URL(origin).origin === origin && origin.startsWith('https://') } catch { return false } })
  return { enabled: Boolean(enabled), url, secret, cohort, rateLimitId, host, origins }
}

async function writeToGoogle(config, payload, fetcher) {
  const signal = AbortSignal.timeout(12000)
  let response = await fetcher(config.url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: config.secret, cohort: config.cohort, ...payload }), redirect: 'manual', signal,
  })
  // ContentService returns its JSON through a one-time Google URL; never resend the secret there.
  if ([302, 303].includes(response.status)) {
    const location = new URL(response.headers.get('location'))
    if (location.protocol !== 'https:' || location.hostname !== 'script.googleusercontent.com' || location.username || location.password || location.port) throw new Error('Invalid Google redirect')
    response = await fetcher(location.href, { redirect: 'error', signal })
  }
  if (!response.ok) throw new Error('Google unavailable')
  return response.json()
}

export function createBetaHandler({ env = process.env, fetcher = fetch, checkLimit }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const send = (status, body) => res.status(status).json(body)
    const config = readConfig(env)
    if (req.method === 'GET') return send(200, { enabled: config.enabled })
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return send(405, { code: 'method_not_allowed' }) }
    if (!config.enabled) return send(503, { code: 'signup_closed' })
    if (!config.origins.includes(req.headers.origin)) return send(403, { code: 'invalid_origin' })
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return send(415, { code: 'invalid_content_type' })
    try {
      const limit = await checkLimit(config.rateLimitId, { headers: { ...req.headers, host: config.host } })
      if (limit.error) return send(503, { code: 'temporarily_unavailable' })
      if (limit.rateLimited) { res.setHeader('Retry-After', '60'); return send(429, { code: 'rate_limited' }) }
      let body = req.body
      if (Number(req.headers['content-length']) > MAX_BODY_BYTES) return send(413, { code: 'request_too_large' })
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        if (Buffer.byteLength(body) > MAX_BODY_BYTES) return send(413, { code: 'request_too_large' })
        try { body = JSON.parse(body.toString()) } catch { return send(400, { code: 'invalid_request' }) }
      }
      if (Buffer.byteLength(JSON.stringify(body) || '') > MAX_BODY_BYTES) return send(413, { code: 'request_too_large' })
      const validated = validateSubmission(body)
      if (validated.code) return send(400, validated)
      const payloadHash = createHash('sha256').update(canonicalPayload(validated.answers, config.cohort)).digest('hex')
      const result = await writeToGoogle(config, { ...body, answers: validated.answers, payload_hash: payloadHash }, fetcher)
      if (result?.code === 'submission_conflict') return send(409, { code: 'submission_conflict' })
      if (result?.ok !== true || !UUID4.test(result.request_id || '') || result.submission_key !== body.submission_key || result.payload_hash !== payloadHash) throw new Error('Unconfirmed save')
      return send(200, { ok: true, request_id: result.request_id, submission_key: body.submission_key })
    } catch {
      return send(503, { code: 'temporarily_unavailable' })
    }
  }
}
