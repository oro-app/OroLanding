import { createHmac, timingSafeEqual } from 'node:crypto'

export function signPhoneProof(phone, secret, now = Date.now()) {
  const expires = Math.floor(now / 1000) + 3600
  const payload = `${phone}.${expires}`
  const signature = createHmac('sha256', secret).update(payload).digest('hex')
  return `${expires}.${signature}`
}

export function verifyPhoneProof(phone, proof, secret, now = Date.now()) {
  if (typeof proof !== 'string' || !/^\d{10}\.[0-9a-f]{64}$/.test(proof)) return false
  const [expires, signature] = proof.split('.')
  if (Number(expires) <= Math.floor(now / 1000) || Number(expires) > Math.floor(now / 1000) + 3600) return false
  const expected = createHmac('sha256', secret).update(`${phone}.${expires}`).digest()
  return timingSafeEqual(Buffer.from(signature, 'hex'), expected)
}
