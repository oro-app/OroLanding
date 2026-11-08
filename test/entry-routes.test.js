import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { getOroTextLink, ORO_FIRST_MESSAGE } from '../src/lib/textOro.js'

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))

test('retired signup routes redirect to the common texting entry', () => {
  for (const source of ['/beta/:path*', '/invite', '/tester/referrals', '/getstarted', '/get-started/:path*', '/meet-oro']) {
    const rule = config.redirects.find(rule => rule.source === source)
    assert.equal(rule?.destination, '/')
    assert.equal(rule?.permanent, true)
  }
  assert.equal(config.rewrites.some(rule => /^\/(beta|invite|tester|get-started)/.test(rule.source)), false)
  assert.equal(config.rewrites.find(rule => rule.source === '/checkout')?.destination, '/checkout/index.html')
})

test('phone links contain the same greeting without invitation metadata', () => {
  for (const [agent, separator] of [['iPhone', '&'], ['Android', '?']]) {
    const link = getOroTextLink(agent, 'https://askoro.now/invite?ref=retired')
    assert.equal(link, `sms:+18556762419${separator}body=${encodeURIComponent(ORO_FIRST_MESSAGE)}`)
  }
})
