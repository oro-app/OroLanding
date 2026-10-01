import { test } from 'node:test'
import assert from 'node:assert/strict'
import { joinPhone, splitPhone } from '../src/components/beta/betaPhone.js'
import { validateAnswers } from '../src/components/beta/betaForm.js'

test('country selection composes national numbers without duplicate calling codes', () => {
  assert.equal(joinPhone('(416) 555-0123', 'CA'), '+14165550123')
  assert.equal(joinPhone('1 213 373 4253', 'US'), '+12133734253')
  assert.equal(joinPhone('07911 123456', 'GB'), '+447911123456')
  assert.equal(joinPhone('06 12 34 56 78', 'FR'), '+33612345678')
  assert.equal(joinPhone('', 'CA'), '')
})

test('pasted international numbers and restored drafts retain their destination', () => {
  for (const value of ['+14165550123', '+12133734253', '+442079460018', '+33612345678']) {
    const phone = splitPhone(value)
    assert.equal(joinPhone(phone.national, phone.country), value)
    assert.equal(validateAnswers({ phone: value }).phone, undefined)
  }
  assert.equal(splitPhone('+442079460018', 'CA').country, 'GB')
  assert.equal(joinPhone('+33612345678', 'CA'), '+33612345678')
})

test('invalid input and extensions are preserved for validation to reject', () => {
  for (const value of ['', 'abc', '12', '4165550123 ext 9', '+14165550123 ext 9']) {
    assert.ok(validateAnswers({ phone: joinPhone(value, 'CA') }).phone)
  }
})
