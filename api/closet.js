export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Referrer-Policy', 'no-referrer')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const authorization = req.headers.authorization
  if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization)) {
    return res.status(401).json({ error: 'Closet link unavailable or expired' })
  }
  try {
    const base = new URL(process.env.ORO_API_URL || 'https://api.buildingoro.ca')
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error()
    const upstream = await fetch(new URL('/closet-link', base), {
      headers: { Authorization: authorization }, redirect: 'error',
      signal: AbortSignal.timeout(20000), cache: 'no-store',
    })
    if (upstream.headers.has('Retry-After')) res.setHeader('Retry-After', upstream.headers.get('Retry-After'))
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Closet unavailable' })
    return res.status(200).json(await upstream.json())
  } catch {
    return res.status(503).json({ error: 'Closet unavailable' })
  }
}
