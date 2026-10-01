import { useState } from 'react'
import { TextField } from 'oro-kit'
import { getCountries, getCountryCallingCode } from 'libphonenumber-js/max'
import { joinPhone, splitPhone } from './betaPhone'

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countries = ['CA', 'US', ...getCountries().filter((country) => !['CA', 'US'].includes(country))
  .sort((a, b) => countryNames.of(a).localeCompare(countryNames.of(b)))]

export default function PhoneAnswer({ value, update, error, disabled }) {
  const [phone, setPhone] = useState(() => splitPhone(value))

  function change(next) {
    setPhone(next)
    update('phone', joinPhone(next.national, next.country))
  }

  return <div className="beta-phone-field">
    <div className="beta-phone-inputs">
      <div className="oro-field">
        <label className="oro-field__label" htmlFor="phone-country">country code</label>
        <select id="phone-country" className="oro-input" value={phone.country} disabled={disabled}
          onChange={(event) => change({ ...phone, country: event.target.value })}>
          {countries.map((country) => <option key={country} value={country}>
            +{getCountryCallingCode(country)} · {countryNames.of(country)}
          </option>)}
        </select>
      </div>
      <TextField id="phone" name="phone" label="phone number" type="tel" inputMode="tel"
        autoComplete="tel-national" placeholder={phone.country === 'CA' || phone.country === 'US' ? '416 555 0123' : 'your number'}
        value={phone.national} onChange={(event) => change(splitPhone(event.target.value, phone.country))}
        maxLength={64} required disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? 'phone-error' : undefined} />
    </div>
    {error && <p id="phone-error" className="oro-field__error">check your country code and enter a valid phone number.</p>}
  </div>
}
