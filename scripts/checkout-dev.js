import checkout from '../api/checkout.js'
import order from '../api/order.js'
import { loadEnv } from 'vite'

export default function checkoutDev() {
  return {
    name: 'checkout-api',
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, 'SHOPIFY_')
      Object.assign(process.env, env)
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (!['/api/checkout', '/api/order'].includes(url.pathname)) return next()
        req.query = Object.fromEntries(url.searchParams)
        res.status = code => { res.statusCode = code; return res }
        res.json = body => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)) }
        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
            if (body.length > 4096) return res.status(413).json({ error: 'Request too large' })
          }
          if (body) req.body = JSON.parse(body)
        } catch {
          return res.status(400).json({ error: 'Invalid request' })
        }
        await (url.pathname === '/api/order' ? order : checkout)(req, res)
      })
    },
  }
}
