export const CHECKOUT_TOKEN_KEY = 'oro_checkout_token'
const TOKEN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
let memoryToken = ''

export function readCheckoutToken() {
  if (typeof window === 'undefined') return ''
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
  if (token && token.length <= 2048 && TOKEN.test(token)) memoryToken = token
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname)
  try {
    if (token && token.length <= 2048 && TOKEN.test(token)) sessionStorage.setItem(CHECKOUT_TOKEN_KEY, token)
    const saved = sessionStorage.getItem(CHECKOUT_TOKEN_KEY) || ''
    return saved.length <= 2048 && TOKEN.test(saved) ? saved : ''
  } catch {
    return memoryToken
  }
}

export function validOffer(offer) {
  return offer?.amount === 2500 && offer.currency === 'usd' && offer.interval === 'month'
    && ((offer.first_month_amount === 1250 && offer.first_month_discount_percent === 50
      && Number.isFinite(Date.parse(offer.launch_offer_ends_at)))
      || (offer.first_month_amount === 2500 && offer.first_month_discount_percent === 0))
}

export function countdown(end, now) {
  const seconds = Math.max(0, Math.ceil((Date.parse(end) - now) / 1000))
  return [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60]
    .map(value => String(value).padStart(2, '0'))
}

export async function checkoutRequest(token, operation = 'status', signal) {
  if (!TOKEN.test(token) || token.length > 2048) throw new Error('Open the personal checkout link Oro sent you.')
  const response = await fetch(`/api/checkout?operation=${operation}`, {
    method: operation === 'checkout' ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}` },
    signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error',
  })
  if ([401, 403, 410].includes(response.status)) throw new Error('Text Oro for a fresh checkout link.')
  if (!response.ok) throw new Error('Checkout is unavailable right now. Please try again.')
  const data = await response.json()
  if (!validOffer(data.offer) || typeof data.status !== 'string') throw new Error('We couldn’t verify your plan. Please try again.')
  if (data.status === 'checkout' && data.client_secret && !/^cs_(?:test|live)_/.test(data.client_secret)) {
    throw new Error('We couldn’t verify your checkout. Please try again.')
  }
  return data
}

export const formatPrice = cents => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: cents % 100 ? 2 : 0,
}).format(cents / 100)

export function stripeAppearance() {
  if (typeof document === 'undefined') return undefined
  const css = getComputedStyle(document.querySelector('.checkout-page') || document.documentElement)
  const value = name => css.getPropertyValue(name).trim()
  const pixels = name => {
    const size = value(name)
    return size.endsWith('rem') ? `${parseFloat(size) * parseFloat(getComputedStyle(document.documentElement).fontSize)}px` : size
  }
  return {
    variables: {
      colorPrimary: value('--oro-color-accent'), colorText: value('--oro-color-ink'),
      colorTextSecondary: value('--oro-color-muted'), colorBackground: value('--oro-color-surface'),
      colorDanger: value('--oro-color-error'), borderRadius: pixels('--oro-radius-field'),
      fontFamily: value('--oro-font-family-body'), fontSizeBase: pixels('--oro-type-body-size'),
      spacingUnit: pixels('--oro-space-1'),
    },
    rules: {
      '.Input': { borderColor: value('--oro-color-border') },
      '.Label': { fontSize: pixels('--oro-type-support-size') },
    },
  }
}
