import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { getBetaCampaign } from '../src/lib/betaCampaign.js'
import { rememberBetaAttribution } from '../src/lib/betaAttribution.js'

test('poster openings follow the current link while saved source and referral stay independent', () => {
  const storage = { value: '', getItem() { return this.value }, setItem(_, value) { this.value = value } }
  rememberBetaAttribution('?src=ig-sunny', storage)
  const search = `?src=poster-dating-campus&ref=${'a'.repeat(64)}`
  assert.equal(getBetaCampaign('/invite', search), 'dating')
  assert.deepEqual(rememberBetaAttribution(search, storage), { source: 'ig-sunny', referral: 'a'.repeat(64) })
  for (const campaign of ['career', 'dating']) {
    assert.equal(getBetaCampaign(`/beta/${campaign}/`, '?src=poster-other'), campaign)
    for (const path of ['/beta', '/invite']) assert.equal(getBetaCampaign(path, `?src=poster-${campaign}-uw-1`), campaign)
  }
  for (const source of ['', 'poster-general', 'poster-careers', 'poster-dating-', 'poster-career--uw', 'poster-Career', 'poster-career/uw']) {
    assert.equal(getBetaCampaign('/beta', `?src=${source}`), 'general')
  }
  assert.equal(getBetaCampaign('/', '?src=poster-career'), 'general')
})

test('query redirects select the campaign before Vercel serves the existing generic HTML', () => {
  const { redirects } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  const conditional = redirects.filter((rule) => rule.has?.some(({ key }) => key === 'src'))
  assert.equal(conditional.length, 2)
  for (const rule of conditional) {
    assert.equal(rule.permanent, false)
    assert.equal(rule.source, '/:entry(beta|invite)')
    const pattern = new RegExp(rule.has[0].value)
    for (const source of ['poster-career', 'poster-dating-uw-1', 'poster-career-', 'ig-sunny']) {
      if (pattern.test(source)) assert.equal(rule.destination, `/beta/${getBetaCampaign('/beta', `?src=${source}`)}`)
    }
  }
})
