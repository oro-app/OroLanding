import test from 'node:test'
import assert from 'node:assert/strict'
import { rememberBetaAttribution } from '../src/lib/betaAttribution.js'

test('homepage campaign and referral tags survive navigation into signup', () => {
  let stored
  const storage = { getItem: () => stored, setItem: (_, value) => { stored = value } }
  const referral = 'a'.repeat(64)
  rememberBetaAttribution(`?src=ig-sunny&ref=${referral}`, storage)
  assert.deepEqual(rememberBetaAttribution('', storage), { source: 'ig-sunny', referral })
  assert.deepEqual(rememberBetaAttribution('?src=poster-campus', storage), { source: 'ig-sunny', referral })
  assert.equal(rememberBetaAttribution(`?ref=${'b'.repeat(64)}`, storage).referral, 'b'.repeat(64))
})

test('invalid tags and blocked storage do not prevent signup', () => {
  assert.deepEqual(rememberBetaAttribution('?src=invalid&ref=nope'), { source: '', referral: '' })
  const storage = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') } }
  assert.equal(rememberBetaAttribution('?src=ig-oro', storage).source, 'ig-oro')
  assert.equal(rememberBetaAttribution('?src=ig-sunny', { getItem: () => '{broken' }).source, 'ig-sunny')
})
