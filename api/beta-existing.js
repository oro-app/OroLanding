import { checkRateLimit } from '@vercel/firewall'
import { createExistingBetaHandler } from './_lib/beta-existing.js'

export const config = { maxDuration: 30 }
export default createExistingBetaHandler({ checkLimit: checkRateLimit })
