import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cents, puttyRequest, readPuttyOrder } from '../src/lib/putty.js'

test('money is parsed into exact integer cents without rounding an invalid bid', () => {
  assert.equal(cents('10'), 1000)
  assert.equal(cents('500.01'), 50001)
  assert.equal(cents('10.1'), 1010)
  for (const invalid of ['1.001', '-10', '1e3', '', 'Infinity', '1000000']) assert.equal(cents(invalid), null)
})

test('backend conflict remains a conflict and never becomes a local claim', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => ({ ok: false, status: 409, json: async () => ({ detail: 'A square is held.' }) })
  try { await assert.rejects(puttyRequest('checkout', {}), error => error.status === 409 && error.message === 'A square is held.') }
  finally { globalThis.fetch = original }
})

test('server rendering does not require browser checkout storage', () => {
  assert.equal(readPuttyOrder(), null)
})
