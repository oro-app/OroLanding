export function hoodieSpots(board) {
  return ['front', ...Array.from({ length: 48 }, (_, i) => `${'ABCDEFGH'[Math.floor(i / 6)]}${i % 6 + 1}`)]
    .map(id => board?.spots?.find(spot => spot.id === id) || { id, unknown: true })
}

export function cents(value) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null
  const [whole, fraction = ''] = String(value).split('.')
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(amount) && amount <= 99999999 ? amount : null
}

export async function puttyRequest(operation, body, signal) {
  const base = (import.meta.env?.VITE_ORO_API_URL || 'https://api.buildingoro.ca').replace(/\/+$/, '')
  const response = await fetch(`${base}/merch/${operation}`, {
    method: body ? 'POST' : 'GET', signal,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    ...(body ? { body: JSON.stringify(body) } : {}),
    credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', redirect: 'error',
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(typeof data.detail === 'string' ? data.detail
      : response.status === 429 ? 'Please wait a moment before trying again.'
        : 'We couldn’t load your bid. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

export function puttyCheckoutUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol === 'https:' && url.hostname === 'checkout.stripe.com') return url.href
  } catch {}
  return ''
}

export function readPuttyOrder() {
  if (typeof window === 'undefined') return null
  const fromUrl = new URLSearchParams(window.location.hash.slice(1)).get('order')
  if (fromUrl) window.history.replaceState(null, '', window.location.pathname)
  try {
    const saved = fromUrl || sessionStorage.getItem('putty-order')
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved || '')) return saved
  } catch { /* The active checkout can still be used without storage. */ }
  return null
}

export function savePuttyOrder(id) {
  try {
    if (id) sessionStorage.setItem('putty-order', id)
    else sessionStorage.removeItem('putty-order')
  } catch { /* Storage is optional; the server remains the source of truth. */ }
}

export function readPuttyDraft() {
  if (typeof window === 'undefined') return { selected: {}, email: '', name: '', consent: false }
  try {
    const draft = JSON.parse(sessionStorage.getItem('putty-draft'))
    if (!draft || typeof draft !== 'object') throw new Error()
    return {
      selected: Object.fromEntries(Object.entries(draft.selected || {}).filter(([id, value]) =>
        (id === 'front' || /^[A-H][1-6]$/.test(id)) && typeof value === 'string' && value.length <= 12)),
      email: typeof draft.email === 'string' ? draft.email.slice(0, 254) : '',
      name: typeof draft.name === 'string' ? draft.name.slice(0, 60) : '',
      consent: draft.consent === true,
    }
  } catch { return { selected: {}, email: '', name: '', consent: false } }
}

export function savePuttyDraft(draft) {
  try { sessionStorage.setItem('putty-draft', JSON.stringify(draft)) }
  catch { /* The form remains usable when session storage is unavailable. */ }
}

export function clearPuttyDraft() {
  try { sessionStorage.removeItem('putty-draft') }
  catch { /* The completed order is still authoritative. */ }
}
