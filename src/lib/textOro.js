export const ORO_TEXT_NUMBER = '+18556762419'
export const ORO_TEXT_NUMBER_DISPLAY = '+1 (855) 676-2419'
export const ORO_FIRST_MESSAGE = 'hey oro, let\'s get started!'

export function getOroTextLink(userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent, inviteUrl = '') {
  const apple = /iPhone|iPad|iPod|Macintosh/.test(userAgent)
  const body = inviteUrl ? `${ORO_FIRST_MESSAGE}\n${inviteUrl}` : ORO_FIRST_MESSAGE
  return `sms:${ORO_TEXT_NUMBER}${apple ? '&' : '?'}body=${encodeURIComponent(body)}`
}

export function isMobileMessagingDevice() {
  if (typeof navigator === 'undefined') return false
  if (navigator.userAgentData?.mobile) return true
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
    || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
}
