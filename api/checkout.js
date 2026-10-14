export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Referrer-Policy', 'no-referrer')
  const operation = req.query.operation || 'status'
  if (!['phone', 'checkout', 'status'].includes(operation)) return res.status(400).json({ error: 'Invalid operation' })
  const method = operation === 'status' ? 'GET' : 'POST'
  if (req.method !== method) {
    res.setHeader('Allow', method)
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const authorization = req.headers.authorization
  if (operation !== 'phone' && (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9_.-]{1,2048}$/.test(authorization))) {
    return res.status(401).json({ error: 'A personal checkout link is required' })
  }
  let body
  if (operation === 'phone') {
    if (typeof req.body?.phone !== 'string' || req.body.phone.length > 32
      || req.body.terms_accepted !== true || req.body.texting_consent !== true) {
      return res.status(400).json({ error: 'Enter your number and accept the signup notice' })
    }
    body = JSON.stringify({ phone: req.body.phone, terms_accepted: true, texting_consent: true })
  }
  try {
    const base = new URL(process.env.ORO_API_URL || 'https://api.buildingoro.ca')
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error()
    const upstream = await fetch(new URL(`/public-onboarding/${operation}`, base), {
      method, headers: {
        ...(operation === 'phone' ? { 'Content-Type': 'application/json' } : { Authorization: authorization }),
        ...(req.headers['x-forwarded-for'] ? { 'X-Forwarded-For': req.headers['x-forwarded-for'] } : {}),
      }, body, redirect: 'error',
      signal: AbortSignal.timeout(20000),
    })
    if (upstream.headers.has('Retry-After')) res.setHeader('Retry-After', upstream.headers.get('Retry-After'))
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Checkout is unavailable' })
    return res.status(200).json(await upstream.json())
  } catch {
    return res.status(503).json({ error: 'Checkout is unavailable' })
  }
}
