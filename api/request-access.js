// Forwards the website's "request access" form to oro-central's waitlist.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Referrer-Policy', 'no-referrer')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const { phone, terms_accepted: terms, texting_consent: consent, referral_code: referral } = req.body || {}
  if (typeof phone !== 'string' || !phone.trim() || phone.length > 32 || terms !== true || consent !== true) {
    return res.status(400).json({ error: 'Enter your number and accept the terms' })
  }
  const body = { phone, terms_accepted: true, texting_consent: true }
  if (typeof referral === 'string' && /^[0-9a-f]{64}$/.test(referral)) body.referral_code = referral
  try {
    const base = new URL(process.env.ORO_API_URL || 'https://api.buildingoro.ca')
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error()
    const upstream = await fetch(new URL('/request-access', base), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers['x-forwarded-for'] ? { 'X-Forwarded-For': req.headers['x-forwarded-for'] } : {}),
      },
      body: JSON.stringify(body),
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    })
    if (upstream.headers.has('Retry-After')) res.setHeader('Retry-After', upstream.headers.get('Retry-After'))
    if (upstream.status === 400) return res.status(400).json({ code: 'invalid_phone' })
    if (upstream.status === 429) return res.status(429).json({ code: 'rate_limited' })
    if (!upstream.ok) return res.status(503).json({ code: 'unavailable' })
    return res.status(202).json({ status: 'requested' })
  } catch {
    return res.status(503).json({ code: 'unavailable' })
  }
}
