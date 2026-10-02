export function messagesInvite(inviteLink, userAgent, text = `thought you'd like oro too :) join me in line: ${inviteLink}`) {
  if (!inviteLink || !/iPhone|iPod|Android/i.test(userAgent)) return ''
  const separator = /iPhone|iPod/i.test(userAgent) ? '&' : '?'
  return `sms:${separator}body=${encodeURIComponent(text)}`
}
