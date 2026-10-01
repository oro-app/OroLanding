import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareReceiptShare, shareReceiptImage } from '../src/components/beta/receiptShare.js'

const blob = new Blob(['generated receipt'], { type: 'image/png' })
const capable = { userAgent: 'iPhone', canShare: () => true, share: async () => {} }

test('supported iOS, iPadOS and Android use native image sharing', () => {
  assert.equal(prepareReceiptShare(blob, capable).mode, 'ios')
  assert.equal(prepareReceiptShare(blob, { ...capable, userAgent: 'Android' }).mode, 'android')
  assert.equal(prepareReceiptShare(blob, { ...capable, userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 5 }).mode, 'ios')
})

test('desktop, unsupported and restricted browsers retain downloads', () => {
  for (const browser of [{ ...capable, userAgent: 'Macintosh' }, {}, { ...capable, share: undefined },
    { ...capable, canShare: () => false }, { ...capable, canShare() { throw new Error('blocked') } }]) {
    assert.equal(prepareReceiptShare(blob, browser).mode, 'download')
  }
  assert.equal(prepareReceiptShare(null, capable), null)
})

test('shares the prepared PNG immediately, without replacing it with a URL', async () => {
  const { file } = prepareReceiptShare(blob, capable)
  let shared
  const result = shareReceiptImage(file, { share(data) { shared = data; return Promise.resolve() } })
  assert.deepEqual(Object.keys(shared), ['files'])
  assert.equal(shared.files[0].name, 'oro-invite-story.png')
  assert.equal(shared.files[0].type, 'image/png')
  assert.equal(await shared.files[0].text(), await blob.text())
  assert.equal(await result, 'shared')
})

test('cancellation is quiet; other failures remain available to the UI', async () => {
  const file = prepareReceiptShare(blob, capable).file
  const cancelled = { share: () => Promise.reject(new DOMException('cancelled', 'AbortError')) }
  assert.equal(await shareReceiptImage(file, cancelled), 'cancelled')
  const blocked = { share: () => Promise.reject(new DOMException('blocked', 'NotAllowedError')) }
  await assert.rejects(shareReceiptImage(file, blocked), { name: 'NotAllowedError' })
})
