import { createServer } from 'vite'

let items = [
  { id: '00000000-0000-4000-8000-000000000001', title: 'Everyday cotton tee', category: 'tops', subtype: 'T-shirt', color: 'White', material: 'Cotton', fit: 'Relaxed', description: 'A soft crew-neck tee with a relaxed fit. An easy everyday layer.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop' },
  { id: '00000000-0000-4000-8000-000000000002', title: 'Straight-leg denim', category: 'bottoms', subtype: 'Jeans', color: 'Blue', material: 'Denim', fit: 'Straight', description: 'Classic blue jeans with a straight leg and a comfortably worn-in feel.', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop' },
  { id: '00000000-0000-4000-8000-000000000003', title: 'Weekend sneakers', category: 'shoes', subtype: 'Sneakers', color: 'Orange', material: 'Leather and textile', description: 'Low-top sneakers with a cushioned sole and bright orange panels.', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop' },
]

const server = await createServer({
  configFile: false,
  root: 'public',
  appType: 'mpa',
  server: { host: '127.0.0.1', port: 5173, strictPort: false },
  plugins: [{
    name: 'local-closet-fixture',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        if (url.pathname !== '/api/closet') return next()
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        if (req.headers.authorization !== `Bearer ${'mock'.padEnd(43, '_')}`) {
          res.statusCode = 401
          return res.end(JSON.stringify({ error: 'Use the local mock link printed in the terminal.' }))
        }
        if (req.method === 'GET') return res.end(JSON.stringify({ items, expires_at: Math.floor(Date.now() / 1000) + 3600 }))
        const item = items.find(item => item.id === url.searchParams.get('item_id'))
        if (!item) { res.statusCode = 404; return res.end('{}') }
        if (req.method === 'DELETE') {
          items = items.filter(candidate => candidate !== item)
          res.statusCode = 204
          return res.end()
        }
        if (req.method === 'PATCH') {
          try {
            let body = ''
            for await (const chunk of req) body += chunk
            const { title } = JSON.parse(body)
            if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) throw new Error()
            item.title = title.trim()
            return res.end(JSON.stringify({ id: item.id, title: item.title }))
          } catch {
            res.statusCode = 400
            return res.end(JSON.stringify({ error: 'Enter a title of 1 to 200 characters.' }))
          }
        }
        res.statusCode = 405
        res.end('{}')
      })
    },
  }],
})

await server.listen()
console.log(`\nMock closet: ${server.resolvedUrls.local[0]}closet/index.html#t=${'mock'.padEnd(43, '_')}\n`)
console.log('Three sample items. Edits and deletions stay in memory; restart to reset.')
