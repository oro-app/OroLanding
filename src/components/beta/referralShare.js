export function messagesInvite(inviteLink, userAgent) {
  if (!inviteLink || !/iPhone|iPod|Android/i.test(userAgent)) return ''
  const separator = /iPhone|iPod/i.test(userAgent) ? '&' : '?'
  const text = `thought you'd like oro too :) join me in line: ${inviteLink}`
  return `sms:${separator}body=${encodeURIComponent(text)}`
}
