import { checkRateLimit } from '@vercel/firewall'
import { createBetaHandler } from './_lib/beta-submission.js'

export const config = { maxDuration: 30 }
export default createBetaHandler({ checkLimit: checkRateLimit })
