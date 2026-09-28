import { useEffect, useId, useRef, useState } from 'react'
import { getCountryCallingCode } from 'libphonenumber-js/max'
import './CountryCodePicker.css'

const flag = (country) => String.fromCodePoint(...[...country].map((letter) => 127397 + letter.charCodeAt(0)))

export default function CountryCodePicker({ value, options, onChange, disabled }) {
  const id = useId()
  const root = useRef(null)
  const trigger = useRef(null)
  const search = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [above, setAbove] = useState(false)
  const selected = options.find(({ country }) => country === value)
  const matches = options.filter(({ country, label }) => `${country} ${label}`.toLowerCase().includes(query.trim().toLowerCase()))

  useEffect(() => {
    if (!open) return
    search.current?.focus()
    const dismiss = (event) => {
      if (!root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  const choose = (country) => {
    onChange(country)
    setOpen(false)
    trigger.current?.focus()
  }

  const handleKeys = (event) => {
    if (!open) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      trigger.current?.focus()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const buttons = [...root.current.querySelectorAll('.gs-country-option')]
      const index = buttons.indexOf(document.activeElement)
      buttons[Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)))]?.focus()
    } else if (event.key === 'Enter' && event.target === search.current && matches.length) {
      event.preventDefault()
      choose(matches[0].country)
    }
  }

  return (
    <div className="gs-country-picker" ref={root} onKeyDown={handleKeys}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
      <button type="button" className="gs-country-trigger" ref={trigger} disabled={disabled}
        aria-label={`Country code: ${selected.label}`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? id : undefined}
        onClick={() => {
          const rect = root.current.getBoundingClientRect()
          setAbove(window.innerHeight - rect.bottom < 320 && rect.top > window.innerHeight - rect.bottom)
          setQuery('')
          setOpen(!open)
        }}>
        <span className="gs-country-flag" aria-hidden="true">{flag(value)}</span>
        <span>+{getCountryCallingCode(value)}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      {open && (
        <div id={id} className={`gs-country-menu${above ? ' is-above' : ''}`} role="dialog" aria-label="Choose a country code">
          <div className="gs-country-search">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" /><path d="m13 13 4 4" /></svg>
            <input ref={search} aria-label="Search countries" placeholder="Search country or code" value={query}
              onChange={(event) => setQuery(event.target.value)} autoComplete="off" spellCheck={false} />
          </div>
          <ul className="gs-country-results">
            {matches.map(({ country, label }) => (
              <li key={country}>
                <button type="button" className="gs-country-option" aria-label={label} aria-pressed={country === value}
                  onClick={() => choose(country)}>
                  <span className="gs-country-flag" aria-hidden="true">{flag(country)}</span>
                  <span className="gs-country-name">{label.split(' (+')[0]}</span>
                  <span className="gs-country-dial">+{getCountryCallingCode(country)}</span>
                  <span className="gs-country-check" aria-hidden="true">{country === value ? '✓' : ''}</span>
                </button>
              </li>
            ))}
          </ul>
          {!matches.length && <p className="gs-country-empty" role="status">No countries found.</p>}
        </div>
      )}
    </div>
  )
}
