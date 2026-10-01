export function getBetaCampaign(pathname = '/', search = '') {
  const path = pathname.replace(/\/+$/, '')
  const explicit = path.match(/^\/beta\/(career|dating)$/)
  if (explicit) return explicit[1]
  if (path !== '/beta' && path !== '/invite') return 'general'
  const source = new URLSearchParams(search).get('src') || ''
  return source.match(/^poster-(career|dating)(?:-[a-z0-9]+)*$/)?.[1] || 'general'
}
