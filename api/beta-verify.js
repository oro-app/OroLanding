import { checkRateLimit } from '@vercel/firewall'
import { createBetaVerificationHandler } from './_lib/beta-verification.js'

export const config = { maxDuration: 20 }
export default createBetaVerificationHandler({ checkLimit: checkRateLimit })
