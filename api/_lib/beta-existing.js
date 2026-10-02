import { parsePhoneNumberFromString } from 'libphonenumber-js/max'
import { MAX_BODY_BYTES, REFERRAL_CODE, UUID4 } from '../../src/lib/betaContract.js'
import { readConfig, writeToGoogle } from './beta-submission.js'
import { verifyPhoneProof } from './beta-phone-proof.js'

export function createExistingBetaHandler({ env = process.env, fetcher = fetch, checkLimit }) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const send = (status, body) => res.status(status).json(body)
    const config = readConfig(env)
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(405, { code: 'method_not_allowed' }) }
    if (!config.enabled) return send(503, { code: 'signup_closed' })
    if (!config.origins.includes(req.headers.origin)) return send(403, { code: 'invalid_origin' })
    if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) return send(415, { code: 'invalid_content_type' })
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
      if (!body || Array.isArray(body) || typeof body !== 'object' || Buffer.byteLength(JSON.stringify(body)) > MAX_BODY_BYTES || Object.keys(body).some((key) => !['phone', 'phone_verification'].includes(key))) return send(400, { code: 'invalid_request' })
      const phone = typeof body.phone === 'string' && body.phone.length <= 64 && parsePhoneNumberFromString(body.phone.trim(), { defaultCountry: 'CA', extract: false })
      if (!phone?.isValid() || phone.ext || !verifyPhoneProof(phone.number, body.phone_verification, config.secret)) return send(400, { code: 'phone_not_verified' })
      const result = await writeToGoogle(config, { action: 'lookup', phone: phone.number }, fetcher)
      if (result?.ok !== true || typeof result.found !== 'boolean') throw new Error('Invalid lookup')
      if (!result.found) return send(200, { ok: true, found: false })
      if (!UUID4.test(result.request_id || '') || !REFERRAL_CODE.test(result.referral_code || '') || !Number.isSafeInteger(result.signup_number) || result.signup_number < 1 || !Number.isSafeInteger(result.referred_signups) || result.referred_signups < 0 || typeof result.referral_completed_date !== 'string') throw new Error('Invalid receipt')
      return send(200, { ok: true, found: true, request_id: result.request_id, referral_code: result.referral_code, signup_number: result.signup_number, referred_signups: result.referred_signups, referral_completed_date: result.referral_completed_date, tester: result.tester === true })
    } catch { return send(503, { code: 'temporarily_unavailable' }) }
  }
}
