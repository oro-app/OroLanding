import { CAMPAIGN_SOURCE, REFERRAL_CODE } from './betaContract.js'

const key = 'oro_beta_attribution'

export function rememberBetaAttribution(search, storage) {
  let saved = {}
  try { saved = JSON.parse(storage?.getItem(key) || '{}') || {} } catch {}
  const query = new URLSearchParams(search)
  const source = CAMPAIGN_SOURCE.test(saved.source || '') ? saved.source : query.get('src') || ''
  const referral = REFERRAL_CODE.test(query.get('ref') || '') ? query.get('ref') : saved.referral || ''
  const result = { source: CAMPAIGN_SOURCE.test(source) ? source : '', referral: REFERRAL_CODE.test(referral) ? referral : '' }
  try { storage?.setItem(key, JSON.stringify(result)) } catch {}
  return result
}

export function browserBetaAttribution() {
  if (typeof window === 'undefined') return { source: '', referral: '' }
  let storage
  try { storage = window.sessionStorage } catch {}
  return rememberBetaAttribution(window.location.search, storage)
}

export function clearBetaAttribution() {
  try { window.sessionStorage.removeItem(key) } catch {}
}
