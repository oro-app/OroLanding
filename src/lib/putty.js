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

const SPOT_ID = /^(?:front|[A-H][1-6])$/
const ORDER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const money = value => Number.isSafeInteger(value) && value >= 0 && value <= 99999999

function validItem(item) {
  return item && SPOT_ID.test(item.spot_id) && money(item.total)
    && (item.minimum === undefined || money(item.minimum))
    && (item.credit === undefined || money(item.credit))
    && (item.due === undefined || money(item.due))
}

export function validPuttyResponse(operation, data) {
  if (!data || typeof data !== 'object' || data.currency !== 'usd') return false
  if (operation === 'board') {
    return typeof data.enabled === 'boolean' && Array.isArray(data.spots)
      && data.spots.length === 49 && new Set(data.spots.map(spot => spot.id)).size === 49
      && data.spots.every(spot => spot && SPOT_ID.test(spot.id) && money(spot.total) && money(spot.minimum) && typeof spot.held === 'boolean'
        && (spot.name == null || typeof spot.name === 'string'))
      && Array.isArray(data.leaderboard) && data.leaderboard.every(entry => entry
        && typeof entry.name === 'string' && Number.isSafeInteger(entry.area) && entry.area > 0 && entry.area <= 49
        && (entry.total_paid == null || (Number.isSafeInteger(entry.total_paid) && entry.total_paid >= 0)))
  }
  return ['checkout', 'status', 'cancel'].includes(operation) && ORDER_ID.test(data.order_id || '')
    && ['pending', 'paid', 'expired'].includes(data.status) && money(data.amount)
    && Array.isArray(data.items) && data.items.length > 0 && data.items.length <= 49
    && data.items.every(validItem) && Number.isFinite(Date.parse(data.hold_until))
    && (data.checkout_url == null || Boolean(puttyCheckoutUrl(data.checkout_url)))
    && (operation !== 'checkout' || Boolean(puttyCheckoutUrl(data.checkout_url)))
    && (data.client_secret == null || /^cs_(?:test|live)_/.test(data.client_secret))
    && (data.publishable_key == null || /^pk_(?:test|live)_/.test(data.publishable_key))
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
  if (!validPuttyResponse(operation, data)) throw new Error('We couldn’t verify the checkout response. Please try again.')
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
