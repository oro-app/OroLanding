export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Referrer-Policy', 'no-referrer')
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH, DELETE')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const authorization = req.headers.authorization
  if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization)) {
    return res.status(401).json({ error: 'Closet link unavailable or expired' })
  }
  let body
  let path = '/closet-link'
  if (req.method !== 'GET') {
    const id = req.query?.item_id
    if (typeof id !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid item' })
    }
    path += `/items/${id}`
    if (req.method === 'PATCH') {
      let data = req.body
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch { return res.status(400).json({ error: 'Invalid title' }) }
      }
      if (!data || typeof data.title !== 'string' || !data.title.trim() || data.title.trim().length > 200
        || Object.keys(data).some(key => key !== 'title')) {
        return res.status(400).json({ error: 'Enter a title of 1 to 200 characters' })
      }
      body = JSON.stringify({ title: data.title.trim() })
    }
  }
  try {
    const base = new URL(process.env.ORO_API_URL || 'https://api.buildingoro.ca')
    if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error()
    const upstream = await fetch(new URL(path, base), {
      method: req.method, body,
      headers: { Authorization: authorization, ...(body ? { 'Content-Type': 'application/json' } : {}) }, redirect: 'error',
      signal: AbortSignal.timeout(20000), cache: 'no-store',
    })
    if (upstream.headers.has('Retry-After')) res.setHeader('Retry-After', upstream.headers.get('Retry-After'))
    if (!upstream.ok) return res.status(upstream.status).json({ error: 'Closet unavailable' })
    if (upstream.status === 204) return res.status(204).end()
    return res.status(200).json(await upstream.json())
  } catch {
    return res.status(503).json({ error: 'Closet unavailable' })
  }
}
