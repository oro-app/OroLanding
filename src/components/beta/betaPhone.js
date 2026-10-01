import { getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js/max'

export function splitPhone(value, country = 'CA') {
  const parsed = parsePhoneNumberFromString(value, { defaultCountry: country, extract: false })
  if (value.trim().startsWith('+') && parsed?.country && !parsed.ext) {
    return { country: parsed.country, national: parsed.formatNational() }
  }
  return { country, national: value }
}

export function joinPhone(national, country) {
  if (!national.trim()) return ''
  if (national.trim().startsWith('+')) return national
  const parsed = parsePhoneNumberFromString(national, { defaultCountry: country, extract: false })
  return parsed && !parsed.ext ? parsed.number : `+${getCountryCallingCode(country)} ${national}`
}
