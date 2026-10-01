export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=300')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const url = process.env.BETA_APPS_SCRIPT_URL
  const secret = process.env.BETA_SUBMISSION_SECRET
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url || '') || !secret || secret.length < 32) return res.status(503).json({ error: 'unavailable' })
  try {
    const signal = AbortSignal.timeout(12000)
    let response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, action: 'count' }), redirect: 'manual', signal,
    })
    if ([302, 303].includes(response.status)) {
      const location = new URL(response.headers.get('location'))
      if (location.protocol !== 'https:' || location.hostname !== 'script.googleusercontent.com' || location.username || location.password || location.port) throw new Error('Invalid Google redirect')
      response = await fetch(location.href, { redirect: 'error', signal })
    }
    if (!response.ok) throw new Error('Google unavailable')
    const result = await response.json()
    if (result.ok !== true || !Number.isSafeInteger(result.count) || result.count < 0) throw new Error('Invalid count')
    return res.status(200).json({ count: result.count })
  } catch {
    return res.status(503).json({ error: 'unavailable' })
  }
}
