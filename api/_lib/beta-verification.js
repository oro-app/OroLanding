import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { MAX_BODY_BYTES } from '../../src/lib/betaContract.js'
import { readConfig } from './beta-submission.js'
import { signPhoneProof } from './beta-phone-proof.js'

export function createBetaVerificationHandler({ env = process.env, fetcher = fetch, checkLimit }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const send = (status, body) => res.status(status).json(body)
    const config = readConfig(env)
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { code: 'method_not_allowed' }) }
    if (!config.enabled) return send(503, { code: 'signup_closed' })
    if (!config.origins.includes(req.headers.origin)) return send(403, { code: 'invalid_origin' })
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return send(415, { code: 'invalid_content_type' })
    const account = env.TWILIO_ACCOUNT_SID || ''
    const token = env.TWILIO_AUTH_TOKEN || ''
    const service = env.TWILIO_VERIFY_SERVICE_SID || ''
    if (!/^AC[0-9a-f]{32}$/i.test(account) || !token || !/^VA[0-9a-f]{32}$/i.test(service)) return send(503, { code: 'temporarily_unavailable' })
    try {
      const limit = await checkLimit(config.rateLimitId, { headers: { ...req.headers, host: new URL(req.headers.origin).host } })
      if (limit.error) return send(503, { code: 'temporarily_unavailable' })
      if (limit.rateLimited) { res.setHeader('Retry-After', '60'); return send(429, { code: 'rate_limited' }) }
      let body = req.body
      if (Number(req.headers['content-length']) > MAX_BODY_BYTES) return send(413, { code: 'request_too_large' })
      if (typeof body === 'string' || Buffer.isBuffer(body)) {
        if (Buffer.byteLength(body) > MAX_BODY_BYTES) return send(413, { code: 'request_too_large' })
        body = JSON.parse(body.toString())
      }
      if (!body || Array.isArray(body) || typeof body !== 'object' || Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES || Object.keys(body).some((key) => !['action', 'phone', 'code'].includes(key))) return send(400, { code: 'invalid_request' })
      const phone = typeof body.phone === 'string' && body.phone.length <= 64 && parsePhoneNumberFromString(body.phone.trim(), { defaultCountry: 'CA', extract: false })
      if (!phone?.isValid() || phone.ext) return send(400, { code: 'invalid_phone' })
      if (body.action !== 'start' && body.action !== 'check') return send(400, { code: 'invalid_request' })
      if (body.action === 'check' && (typeof body.code !== 'string' || !/^\d{4,10}$/.test(body.code))) return send(400, { code: 'invalid_code' })
      if (body.action === 'start' && body.code !== undefined) return send(400, { code: 'invalid_request' })
      const endpoint = body.action === 'start' ? 'Verifications' : 'VerificationCheck'
      const params = new URLSearchParams(body.action === 'start' ? { To: phone.number, Channel: 'sms' } : { To: phone.number, Code: body.code })
      const response = await fetcher(`https://verify.twilio.com/v2/Services/${service}/${endpoint}`, {
        method: 'POST', headers: { Authorization: `Basic ${Buffer.from(`${account}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params, signal: AbortSignal.timeout(12000),
      })
      const result = await response.json()
      if (response.status === 429) { res.setHeader('Retry-After', '60'); return send(429, { code: 'rate_limited' }) }
      if (body.action === 'start' && response.ok && result.status === 'pending') return send(200, { ok: true })
      if (body.action === 'check' && response.ok && result.status === 'approved') return send(200, { ok: true, proof: signPhoneProof(phone.number, config.secret) })
      if (body.action === 'check' && (response.ok || [400, 404].includes(response.status))) return send(400, { code: 'invalid_code' })
      return send(503, { code: 'temporarily_unavailable' })
    } catch { return send(503, { code: 'temporarily_unavailable' }) }
  }
}
